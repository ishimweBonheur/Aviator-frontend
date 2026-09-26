import type { GameService } from "@/features/game/types/game-service.types";
import type { GameSnapshot } from "@/features/game/types/game.types";
import type { AutoSettings, Bet } from "@/features/betting/types/betting.types";

import { api } from "@/services/backendApi";
import { ApiError, request } from "@/services/api";
import { createGameSocket } from "@/services/socket";
import type { ApiRound, RoundEvent } from "@/types/api.types";

const SESSION_KEY = "altitude-backend-session";
const emptyState = (): GameSnapshot => ({
  mode: "backend",
  connection: "connecting",
  balanceLoaded: false,
  balance: 0,
  round: {
    id: "0",
    roundNumber: 0,
    status: "WAITING",
    multiplier: 1,
    crashMultiplier: 0,
    startedAt: null,
    endedAt: null,
  },
  countdown: 0,
  bets: [],
  history: [],
  players: [],
  pendingPanels: [],
  auto: [0, 1].map(() => ({
    enabled: false,
    cashOut: false,
    target: 2,
    amount: 1000,
  })),
});

export class BackendGameService implements GameService {
  private eventVersion = 0;
  private refreshVersion = 0;
  private state = emptyState();
  private token = "";
  private listeners = new Set<() => void>();
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pollTimer?: ReturnType<typeof setInterval>;
  private reconnectAttempt = 0;
  private authVersion = 0;
  private balanceVersion = 0;
  private lastClosedRound = 0;
  private historyIds = new Set<number>();
  private lastEventAt = 0;

  constructor() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
      if (
        typeof saved?.token === "string" &&
        typeof saved?.user?.id === "number"
      ) {
        this.token = saved.token;
        this.state.user = saved.user;
        this.state.bets = Array.isArray(saved.bets)
          ? saved.bets
              .filter(
                (b: Bet) =>
                  typeof b.id === "string" && typeof b.roundId === "string",
              )
              .slice(0, 200)
          : [];
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.connect();
      void this.refresh();
      this.pollTimer = setInterval(() => {
        if (
          this.socket?.readyState === WebSocket.OPEN &&
          Date.now() - this.lastEventAt > 15000
        )
          this.socket.close();
        void this.refresh();
      }, 5000);
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        clearInterval(this.pollTimer);
        clearTimeout(this.reconnectTimer);
        const socket = this.socket;
        this.socket = undefined;
        socket?.close();
      }
    };
  };
  private publish(update: Partial<GameSnapshot>) {
    this.state = { ...this.state, ...update };
    this.listeners.forEach((listener) => listener());
  }
  private persist() {
    if (this.token && this.state.user)
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          token: this.token,
          user: this.state.user,
          bets: this.state.bets.slice(0, 200),
        }),
      );
  }
  private connect() {
    if (!this.listeners.size) return;
    this.publish({ connection: "connecting", bettingRound: undefined });
    const socket = createGameSocket();
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.reconnectAttempt = 0;
      this.lastEventAt = Date.now();
      this.publish({ connection: "connected", error: undefined });
      void this.refresh();
    };
    socket.onmessage = (message) => {
      if (this.socket !== socket) return;
      try {
        const event: RoundEvent = JSON.parse(message.data);
        if (
          !Number.isSafeInteger(event.round_id) ||
          !Number.isSafeInteger(event.round_number)
        )
          return;
        this.lastEventAt = Date.now();
        if (event.type !== "MULTIPLIER_UPDATE") this.eventVersion++;
        this.onEvent(event);
      } catch {
        this.publish({
          error:
            "An invalid game event was received. Waiting for the next update.",
        });
      }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.publish({
        connection: "offline",
        bettingRound: undefined,
        error:
          "Live connection lost. Betting and cash-out are paused until reconnection.",
      });
      this.reconnectTimer = setTimeout(
        () => this.connect(),
        Math.min(1000 * 2 ** this.reconnectAttempt++, 10000),
      );
    };
  }
  refresh = async () => {
    const authVersion = this.authVersion,
      version = ++this.refreshVersion,
      events = this.eventVersion;
    try {
      const [snapshot, rounds, limits] = await Promise.all([
        api.currentRound(),
        api.rounds(),
        api.limits(),
      ]);
      if (version !== this.refreshVersion) return;
      this.publish({
        history: rounds.map((r) => Number(r.crash_point)),
        limits,
      });
      this.historyIds = new Set(rounds.map((r) => r.id));
      if (events === this.eventVersion) {
        this.publish({ bettingRound: undefined, countdown: 0 });
        if (snapshot.running) {
          this.applyRound(snapshot.running);
          this.onEvent({
            type: "MULTIPLIER_UPDATE",
            round_id: snapshot.running.id,
            round_number: snapshot.running.round_number,
            multiplier: snapshot.current_multiplier,
          });
        } else
          this.publish({
            round: { ...this.state.round, status: "WAITING", multiplier: 1 },
          });
        if (snapshot.upcoming) {
          const r = snapshot.upcoming;
          const seconds = r.betting_closes_at
            ? Math.max(
                0,
                Math.ceil(
                  (Date.parse(r.betting_closes_at) -
                    Date.parse(snapshot.server_time)) /
                    1000,
                ),
              )
            : 0;
          this.publish({
            bettingRound: { id: String(r.id), roundNumber: r.round_number },
            countdown: seconds,
          });
        }
      }
      if (this.token && !this.state.pendingPanels?.length) {
        const bets = await api.bets(this.token);
        if (
          authVersion === this.authVersion &&
          version === this.refreshVersion &&
          !this.state.pendingPanels?.length
        ) {
          this.publish({
            bets: bets.map((b) => ({
              id: String(b.id),
              roundId: String(b.round_id),
              roundNumber: b.round_number,
              userId: String(b.user_id),
              panel: b.bet_number - 1,
              amount: Number(b.amount),
              status:
                b.status === "ACTIVE" &&
                ["BETTING_OPEN", "BETTING_CLOSED"].includes(b.round_status)
                  ? "PENDING"
                  : b.status,
              cashOutMultiplier: b.cashout_multiplier
                ? Number(b.cashout_multiplier)
                : undefined,
              potentialWin:
                b.status === "CASHED_OUT"
                  ? Number(b.payout)
                  : b.status === "ACTIVE"
                    ? Number(b.amount) *
                      (b.round_id === Number(this.state.round.id)
                        ? this.state.round.multiplier
                        : 1)
                    : 0,
            })),
          });
          this.persist();
        }
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        authVersion === this.authVersion
      )
        this.expireSession();
      else this.publish({ error: (error as Error).message });
    }
    if (this.token && authVersion === this.authVersion)
      await this.refreshBalance();
  };
  private async refreshBalance() {
    const version = this.authVersion,
      requestVersion = ++this.balanceVersion;
    try {
      const response = await api.balance(this.token);
      if (
        version !== this.authVersion ||
        requestVersion !== this.balanceVersion
      )
        return;
      const balance = Number(response.balance);
      if (!Number.isFinite(balance) || response.user_id !== this.state.user?.id)
        throw new Error("Invalid wallet response");
      this.publish({ balance, balanceLoaded: true });
    } catch (error) {
      if (
        version !== this.authVersion ||
        requestVersion !== this.balanceVersion
      )
        return;
      if (error instanceof ApiError && error.status === 401)
        this.expireSession();
      else
        this.publish({
          balanceLoaded: false,
          error: `Wallet: ${(error as Error).message}`,
        });
    }
  }
  private applyRound(round: ApiRound) {
    // The current-round endpoint returns the newest upcoming round, not necessarily the flying one.
    if (round.status === "BETTING_OPEN") {
      if (
        round.id > this.lastClosedRound &&
        round.round_number >= this.state.round.roundNumber
      ) {
        this.publish({
          bettingRound: {
            id: String(round.id),
            roundNumber: round.round_number,
          },
        });
      }
    } else if (
      round.status === "RUNNING" &&
      round.round_number >= this.state.round.roundNumber &&
      this.state.round.status !== "FLYING"
    ) {
      this.onEvent({
        type: "ROUND_STARTED",
        round_id: round.id,
        round_number: round.round_number,
      });
    }
  }
  private onEvent(event: RoundEvent) {
    if (event.type.startsWith("BET_")) {
      if (this.token) void this.refresh();
      return;
    }
    if (event.type === "COUNTDOWN") {
      if (event.round_id >= this.lastClosedRound)
        this.publish({
          bettingRound: {
            id: String(event.round_id),
            roundNumber: event.round_number,
          },
          countdown: event.seconds_remaining ?? 0,
        });
      return;
    }
    const id = String(event.round_id);
    if (event.type === "ROUND_OPENED") {
      if (event.round_id > this.lastClosedRound)
        this.publish({ bettingRound: { id, roundNumber: event.round_number } });
      return;
    }
    if (event.type === "ROUND_STARTED" || event.type === "MULTIPLIER_UPDATE") {
      if (
        event.round_number < this.state.round.roundNumber ||
        (this.state.round.id === id && this.state.round.status === "CRASHED")
      )
        return;
      let multiplier =
        event.type === "MULTIPLIER_UPDATE" ? Number(event.multiplier) : 1;
      if (!Number.isFinite(multiplier) || multiplier < 1) return;
      if (this.state.round.id === id)
        multiplier = Math.max(multiplier, this.state.round.multiplier);
      this.lastClosedRound = Math.max(this.lastClosedRound, event.round_id);
      this.publish({
        round: {
          id,
          roundNumber: event.round_number,
          status: "FLYING",
          multiplier,
          crashMultiplier: 0,
          startedAt:
            this.state.round.id === id
              ? this.state.round.startedAt
              : Date.now(),
          endedAt: null,
        },
        bettingRound:
          this.state.bettingRound &&
          Number(this.state.bettingRound.id) > event.round_id
            ? this.state.bettingRound
            : undefined,
        bets: this.state.bets.map((b) =>
          b.roundId === id && (b.status === "PENDING" || b.status === "ACTIVE")
            ? {
                ...b,
                status: "ACTIVE",
                potentialWin: Number((b.amount * multiplier).toFixed(2)),
              }
            : b.roundNumber < event.round_number &&
                ["PENDING", "ACTIVE"].includes(b.status)
              ? { ...b, status: "UNKNOWN" }
              : b,
        ),
      });
      if (event.type === "ROUND_STARTED") this.persist();
      return;
    }
    if (event.type === "ROUND_CRASHED") {
      const crash = Number(event.crash_point);
      if (!Number.isFinite(crash) || crash < 1) return;
      this.lastClosedRound = Math.max(this.lastClosedRound, event.round_id);
      if (this.state.bettingRound?.id === id)
        this.publish({ bettingRound: undefined });
      if (!this.historyIds.has(event.round_id)) {
        this.historyIds.add(event.round_id);
        this.publish({ history: [crash, ...this.state.history].slice(0, 30) });
      }
      if (event.round_number >= this.state.round.roundNumber)
        this.publish({
          round: {
            id,
            roundNumber: event.round_number,
            status: "CRASHED",
            multiplier: crash,
            crashMultiplier: crash,
            startedAt: this.state.round.startedAt,
            endedAt: Date.now(),
          },
        });
    }
    if (event.type === "ROUND_CRASHED" || event.type === "ROUND_SETTLED") {
      this.publish({
        bets: this.state.bets.map((b) =>
          b.roundId === id && ["PENDING", "ACTIVE"].includes(b.status)
            ? { ...b, status: "LOST", potentialWin: 0 }
            : b,
        ),
      });
      this.persist();
      if (event.type === "ROUND_SETTLED" && this.token)
        void this.refreshBalance();
    }
  }
  login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (!response.token || !response.user?.ID)
      throw new Error("Invalid login response");
    this.authVersion++;
    this.token = response.token;
    const sameUser = this.state.user?.id === response.user.ID;
    this.publish({
      user: {
        id: response.user.ID,
        username: response.user.Username,
        email: response.user.Email,
        role: response.user.Role,
      },
      bets: sameUser ? this.state.bets : [],
      pendingPanels: [],
      balance: 0,
      balanceLoaded: false,
      error: undefined,
    });
    this.persist();
    await this.refresh();
    if (!this.state.user)
      throw new Error("Session could not be verified. Sign in again.");
  };
  register = async (username: string, email: string, password: string) => {
    await api.register(username, email, password);
  };
  logout = () => {
    this.authVersion++;
    this.token = "";
    sessionStorage.removeItem(SESSION_KEY);
    this.publish({
      user: undefined,
      balance: 0,
      balanceLoaded: false,
      bets: [],
      pendingPanels: [],
      error: undefined,
    });
  };
  private expireSession() {
    this.logout();
    this.publish({ error: "Your session expired. Sign in again." });
  }
  placeBet = async (panel: number, amount: number, autoCashOut?: number) => {
    if (!this.token) throw new Error("Sign in to place a bet");
    const target = this.state.bettingRound;
    if (
      this.state.connection !== "connected" ||
      !target ||
      this.state.countdown <= 0
    )
      throw new Error("Waiting for an open betting round");
    if (!this.state.balanceLoaded)
      throw new Error("Wait for your wallet to synchronize");
    if (
      !Number.isFinite(amount) ||
      amount < Number(this.state.limits?.MinBet ?? 50) ||
      amount > Number(this.state.limits?.MaxBet ?? 1000000) ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001
    )
      throw new Error(
        "Enter 50 to 1,000,000 RWF with at most two decimal places",
      );
    if (autoCashOut !== undefined)
      throw new Error("Server-side auto cash-out is not implemented");
    if (
      this.state.pendingPanels?.includes(panel) ||
      this.state.bets.some((b) => b.panel === panel && b.roundId === target.id)
    )
      throw new Error(
        "This panel already has a bet or an unconfirmed request for that round",
      );
    const version = this.authVersion;
    const pending: Bet = {
      id: `request-${crypto.randomUUID()}`,
      userId: String(this.state.user!.id),
      panel,
      roundId: target.id,
      roundNumber: target.roundNumber,
      amount,
      potentialWin: 0,
      status: "UNKNOWN",
    };
    this.publish({
      bets: [pending, ...this.state.bets].slice(0, 200),
      pendingPanels: [...this.state.pendingPanels!, panel],
    });
    this.persist();
    try {
      const { bet } = await api.placeBet(
        this.token,
        Number(target.id),
        panel,
        amount,
      );
      if (version !== this.authVersion) return;
      if (
        !Number.isSafeInteger(bet.id) ||
        bet.round_id !== Number(target.id) ||
        bet.bet_number !== panel + 1
      )
        throw new ApiError("Invalid bet response", 0);
      const current = this.state.round;
      const status =
        current.roundNumber > target.roundNumber ||
        (current.id === target.id && current.status === "CRASHED")
          ? "LOST"
          : current.id === target.id && current.status === "FLYING"
            ? "ACTIVE"
            : "PENDING";
      this.publish({
        bets: this.state.bets.map((b) =>
          b.id === pending.id
            ? {
                ...pending,
                id: String(bet.id),
                amount: Number(bet.amount),
                status,
                potentialWin: status === "LOST" ? 0 : Number(bet.amount),
              }
            : b,
        ),
      });
      await this.refreshBalance();
    } catch (error) {
      if (version !== this.authVersion) return;
      const definite =
        error instanceof ApiError && error.status >= 400 && error.status < 500;
      if (definite)
        this.publish({
          bets: this.state.bets.filter((b) => b.id !== pending.id),
        });
      else
        this.publish({
          error:
            "Bet response unconfirmed. Do not retry this panel for the same round; refresh to reconcile the persisted bet.",
        });
      if (error instanceof ApiError && error.status === 401)
        this.expireSession();
      throw error;
    } finally {
      if (version === this.authVersion) {
        this.publish({
          pendingPanels: this.state.pendingPanels!.filter((p) => p !== panel),
        });
        this.persist();
        await this.refresh();
      }
    }
  };
  cashOut = async (panel: number) => {
    if (!this.token || this.state.connection !== "connected")
      throw new Error("Sign in and connect before cashing out");
    const bet = this.state.bets.find(
      (b) =>
        b.panel === panel &&
        b.roundId === this.state.round.id &&
        b.status === "ACTIVE",
    );
    if (
      !bet ||
      this.state.round.status !== "FLYING" ||
      this.state.pendingPanels?.includes(panel)
    )
      throw new Error("No active bet is available to cash out");
    const version = this.authVersion;
    this.publish({
      pendingPanels: [...this.state.pendingPanels!, panel],
      bets: this.state.bets.map((b) =>
        b.id === bet.id ? { ...b, status: "UNKNOWN" } : b,
      ),
    });
    this.persist();
    try {
      const result = await api.cashOut(this.token, bet.id);
      if (version !== this.authVersion) return;
      if (
        String(result.bet_id) !== bet.id ||
        !Number.isFinite(Number(result.payout)) ||
        !Number.isFinite(Number(result.multiplier)) ||
        !Number.isFinite(Number(result.remaining_balance)) ||
        Number(result.multiplier) < 1
      )
        throw new ApiError("Invalid cash-out response", 0);
      this.balanceVersion++;
      this.publish({
        balance: Number(result.remaining_balance),
        balanceLoaded: true,
        bets: this.state.bets.map((b) =>
          b.id === bet.id
            ? {
                ...b,
                status: "CASHED_OUT",
                cashOutMultiplier: Number(result.multiplier),
                potentialWin: Number(result.payout),
              }
            : b,
        ),
      });
    } catch (error) {
      if (version !== this.authVersion) return;
      // The backend can return 400 after committing a cash-out if its subsequent balance read fails.
      const definite =
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        !error.message.includes("cashout completed");
      if (definite)
        this.publish({
          bets: this.state.bets.map((b) =>
            b.id === bet.id
              ? {
                  ...bet,
                  status:
                    this.state.round.id === bet.roundId &&
                    this.state.round.status === "FLYING"
                      ? "ACTIVE"
                      : "LOST",
                }
              : b,
          ),
        });
      else
        this.publish({
          error:
            "Cash-out response unconfirmed. Refresh to reconcile the persisted bet.",
        });
      await this.refreshBalance();
      if (error instanceof ApiError && error.status === 401)
        this.expireSession();
      throw error;
    } finally {
      if (version === this.authVersion) {
        this.publish({
          pendingPanels: this.state.pendingPanels!.filter((p) => p !== panel),
        });
        this.persist();
        await this.refresh();
      }
    }
  };
  cancelBet = async (panel: number) => {
    const bet = this.state.bets.find(
      (b) =>
        b.panel === panel &&
        b.roundId === this.state.bettingRound?.id &&
        b.status === "PENDING",
    );
    if (
      !bet ||
      this.state.countdown <= 0 ||
      this.state.pendingPanels?.includes(panel)
    )
      throw new Error("No cancellable bet");
    const version = this.authVersion;
    this.publish({ pendingPanels: [...this.state.pendingPanels!, panel] });
    try {
      await api.cancel(this.token, bet.id);
    } finally {
      if (version === this.authVersion) {
        this.publish({
          pendingPanels: this.state.pendingPanels!.filter((p) => p !== panel),
        });
        await this.refresh();
      }
    }
  };
  accountRequest = async <T>(path: string, body?: unknown, method?: string): Promise<T> => {
    const version = this.authVersion;
    try {
      return await request<T>(path, {
        token: this.token,
        body,
        method: method ?? (body === undefined ? "GET" : "POST"),
      });
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        version === this.authVersion
      )
        this.expireSession();
      throw error;
    } finally {
      if (body !== undefined && version === this.authVersion)
        await this.refresh();
    }
  };
  addDemoFunds = () => {
    throw new Error("Use the SANDBOX deposit form");
  };
  configureAuto = (panel: number, settings: AutoSettings) => {
    this.publish({
      auto: this.state.auto.map((a, i) =>
        i === panel ? { ...settings, enabled: false, cashOut: false } : a,
      ),
    });
  };
}

import type { GameService } from "@/features/game/types/game-service.types";
import type { GameSnapshot } from "@/features/game/types/game.types";
import type { AutoSettings, Bet } from "@/features/betting/types/betting.types";

import { api } from "@/features/game/services/backendApi";
import { ApiError } from "@/services/api";
import { createGameSocket } from "@/services/socket";
import type { ApiRound } from "@/features/game/types/game-api.types";
import type { RoundEvent } from "@/features/game/types/round-event.types";
import type { ApiAutoSetting } from "@/features/betting/types/betting-api.types";

import { session } from "@/features/auth/services/session";
import { walletApi } from "@/features/wallet/services/wallet.api";
const emptyState = (): GameSnapshot => ({
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
  private get token() {
    return session.getToken();
  }
  private listeners = new Set<() => void>();
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pollTimer?: ReturnType<typeof setInterval>;
  private reconnectAttempt = 0;
  private get authVersion() {
    return session.getSnapshot().revision;
  }
  private balanceVersion = 0;
  private lastClosedRound = 0;
  private historyIds = new Set<number>();
  private lastEventAt = 0;
  private betsVersion = 0;
  private lastBetsSyncAt = 0;
  private autoSaving = false;

  constructor() {
    this.state.user = session.getSnapshot().user;
    session.subscribe(() => {
      const auth = session.getSnapshot();
      this.publish({
        user: auth.user,
        error: auth.error,
        balance: 0,
        balanceLoaded: false,
        bets: [],
        pendingPanels: [],
        auto: emptyState().auto,
      });
      if (this.listeners.size && auth.user) void this.refresh();
    });
    walletApi.subscribeChanges(() => {
      if (this.listeners.size && this.token) void this.refreshBalance();
    });
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
  private async refreshBets() {
    if (!this.token || this.state.pendingPanels?.length) return;
    const auth = this.authVersion,
      version = ++this.betsVersion;
    this.lastBetsSyncAt = Date.now();
    try {
      const bets = await api.bets(this.token);
      if (
        auth !== this.authVersion ||
        version !== this.betsVersion ||
        this.state.pendingPanels?.length
      )
        return;
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
          autoCashOut: b.auto_cashout_multiplier
            ? Number(b.auto_cashout_multiplier)
            : undefined,
          potentialWin: Number(b.potential_payout ?? b.payout),
          canCancel: b.can_cancel,
          canCashout: b.can_cashout,
        })),
      });
    } catch (error) {
      if (auth !== this.authVersion) return;
      if (error instanceof ApiError && error.status === 401)
        this.expireSession();
      else this.publish({ error: (error as Error).message });
    }
  }
  private applyAutoSettings(settings: ApiAutoSetting[]) {
    this.publish({
      auto: this.state.auto.map((draft, panel) => {
        const saved = settings.find((s) => s.bet_number === panel + 1);
        if (!saved) return draft;
        return {
          ...draft,
          enabled: saved.enabled,
          error: saved.last_error,
          ...(saved.enabled || draft.enabled
            ? {
                amount: Number(saved.amount),
                cashOut: saved.auto_cashout_multiplier !== null,
                target: Number(saved.auto_cashout_multiplier ?? 2),
              }
            : {}),
        };
      }),
    });
  }
  private async refreshAutoSettings() {
    if (!this.token || this.autoSaving) return;
    const auth = this.authVersion;
    const saved = await api.autoSettings(this.token);
    if (auth === this.authVersion && !this.autoSaving)
      this.applyAutoSettings(saved);
  }
  private connect() {
    if (!this.listeners.size) return;
    this.publish({
      connection: "connecting",
      bettingRound: undefined,
      countdown: 0,
    });
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
        this.eventVersion++;
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
        countdown: 0,
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
        if (!snapshot.running && snapshot.upcoming) {
          const r = snapshot.upcoming;
          const seconds = snapshot.seconds_remaining ?? 0;
          if (["BETTING_OPEN", "BETTING_CLOSED"].includes(r.status))
            this.openRound(
              r.id,
              r.round_number,
              r.status === "BETTING_OPEN" ? seconds : 0,
            );
        }
      }
      await this.refreshBets();
      await this.refreshAutoSettings();
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
  private openRound(id: number, roundNumber: number, seconds: number) {
    if (
      id <= this.lastClosedRound ||
      roundNumber < this.state.round.roundNumber
    )
      return;
    this.publish({
      bettingRound: { id: String(id), roundNumber },
      countdown: seconds,
      round: {
        id: String(id),
        roundNumber,
        status: seconds > 0 ? "BETTING" : "BETTING_CLOSED",
        multiplier: 1,
        crashMultiplier: 0,
        startedAt: null,
        endedAt: null,
      },
    });
  }
  private applyRound(round: ApiRound) {
    if (
      round.status === "RUNNING" &&
      round.round_number >= this.state.round.roundNumber &&
      (this.state.round.id !== String(round.id) ||
        this.state.round.status !== "FLYING")
    ) {
      this.onEvent({
        type: "ROUND_STARTED",
        round_id: round.id,
        round_number: round.round_number,
        timestamp: round.started_at,
      });
    }
  }
  private onEvent(event: RoundEvent) {
    if (event.type.startsWith("BET_")) {
      if (this.token) void this.refresh();
      return;
    }
    const id = String(event.round_id);
    if (event.type === "COUNTDOWN" || event.type === "ROUND_OPENED") {
      const seconds = event.seconds_remaining ?? 0;
      this.openRound(
        event.round_id,
        event.round_number,
        Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
      );
      return;
    }
    if (event.type === "ROUND_STARTED" || event.type === "MULTIPLIER_UPDATE") {
      if (
        event.round_number < this.state.round.roundNumber ||
        (this.state.round.id === id && this.state.round.status === "CRASHED")
      )
        return;
      // A tick can update an existing flight, never start one. REST recovery
      // explicitly applies RUNNING via ROUND_STARTED before applying a tick.
      if (
        event.type === "MULTIPLIER_UPDATE" &&
        (this.state.round.id !== id || this.state.round.status !== "FLYING")
      )
        return;
      if (
        event.type === "ROUND_STARTED" &&
        event.round_id <= this.lastClosedRound &&
        (this.state.round.id !== id || this.state.round.status !== "FLYING")
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
            this.state.round.id === id && this.state.round.startedAt
              ? this.state.round.startedAt
              : event.timestamp
                ? Date.parse(event.timestamp)
                : Date.now(),
          endedAt: null,
        },
        bettingRound:
          this.state.bettingRound &&
          Number(this.state.bettingRound.id) > event.round_id
            ? this.state.bettingRound
            : undefined,
        countdown:
          Number(this.state.bettingRound?.id ?? 0) > event.round_id
            ? this.state.countdown
            : 0,
      });
      if (
        event.type === "ROUND_STARTED" ||
        Date.now() - this.lastBetsSyncAt >= 1000
      )
        void this.refreshBets();
      return;
    }
    if (event.type === "ROUND_CRASHED") {
      const crash = Number(event.crash_point);
      if (!Number.isFinite(crash) || crash < 1) return;
      this.lastClosedRound = Math.max(this.lastClosedRound, event.round_id);
      if (this.state.bettingRound?.id === id)
        this.publish({ bettingRound: undefined, countdown: 0 });
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
            multiplier: 1,
            crashMultiplier: crash,
            startedAt: this.state.round.startedAt,
            endedAt: Date.now(),
          },
        });
    }
    if (event.type === "ROUND_SETTLED") {
      this.lastClosedRound = Math.max(this.lastClosedRound, event.round_id);
      if (this.state.round.id === id)
        this.publish({
          round: { ...this.state.round, status: "WAITING", multiplier: 1 },
          countdown: 0,
          bettingRound: undefined,
        });
    }
    if (event.type === "ROUND_CRASHED" || event.type === "ROUND_SETTLED") {
      void this.refreshBets();
      if (event.type === "ROUND_SETTLED" && this.token)
        void this.refreshBalance();
    }
  }
  private expireSession() {
    session.expire();
  }
  placeBet = async (panel: number, amount: number, autoCashOut?: number) => {
    if (!this.token) throw new Error("Sign in to place a bet");
    const target = this.state.bettingRound;
    if (
      this.state.connection !== "connected" ||
      this.state.round.status !== "BETTING" ||
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
    try {
      const { bet } = await api.placeBet(
        this.token,
        Number(target.id),
        panel,
        amount,
        autoCashOut,
      );
      if (version !== this.authVersion) return;
      if (
        !Number.isSafeInteger(bet.id) ||
        bet.round_id !== Number(target.id) ||
        bet.bet_number !== panel + 1
      )
        throw new ApiError("Invalid bet response", 0);
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
      !bet.canCashout ||
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
                  status: bet.status,
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
      !this.token ||
      this.state.connection !== "connected" ||
      this.state.round.status !== "BETTING" ||
      !bet ||
      !bet.canCancel ||
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
  configureAuto = async (panel: number, settings: AutoSettings) => {
    const before = this.state.auto[panel];
    // Amount and target edits are form drafts. Enabling/disabling automation is an API operation.
    if (!before.enabled && !settings.enabled) {
      this.publish({
        auto: this.state.auto.map((a, i) => (i === panel ? settings : a)),
      });
      return;
    }
    if (!this.token) throw new Error("Sign in to configure automatic betting");
    if (this.autoSaving) throw new Error("Wait for settings to save");
    const auth = this.authVersion;
    this.autoSaving = true;
    try {
      const saved = await api.saveAutoSettings(this.token, panel, {
        enabled: settings.enabled,
        amount: settings.amount.toFixed(2),
        auto_cashout_multiplier: settings.cashOut
          ? settings.target.toFixed(2)
          : null,
      });
      if (auth === this.authVersion) this.applyAutoSettings(saved);
    } finally {
      this.autoSaving = false;
    }
  };
}

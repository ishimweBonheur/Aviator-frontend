import type { GameSnapshot } from "@/features/game/types/game.types";
import type { AutoSettings, Bet } from "@/features/betting/types/betting.types";

import type { GameService } from "@/features/game/types/game-service.types";
import { makePlayers } from "@/data/mockBets";
import { MOCK_ROUNDS } from "@/data/mockRounds";
export class DemoGameService implements GameService {
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private phaseStart = Date.now();
  private state: GameSnapshot = {
    round: {
      id: "round-824091",
      roundNumber: 824091,
      status: "WAITING",
      multiplier: 1,
      crashMultiplier: 0,
      startedAt: null,
      endedAt: null,
    },
    countdown: 5,
    balance: 25000,
    bets: [],
    history: [...MOCK_ROUNDS],
    players: makePlayers(),
    auto: [0, 1].map(() => ({
      enabled: false,
      cashOut: false,
      target: 2,
      amount: 1000,
    })),
  };
  private crashAt = 2 + Math.random() * 5;
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.timer) this.timer = setInterval(this.tick, 50);
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  };
  private publish = () => {
    this.state = { ...this.state };
    this.listeners.forEach((listener) => listener());
  };
  private tick = () => {
    const elapsed = Date.now() - this.phaseStart;
    const round = this.state.round;
    if (round.status === "WAITING" || round.status === "BETTING") {
      this.state.countdown = Math.max(0, Math.ceil((6000 - elapsed) / 1000));
      this.state.round = {
        ...round,
        status: elapsed < 1000 ? "WAITING" : "BETTING",
      };
      if (elapsed >= 6000) {
        this.phaseStart = Date.now();
        this.state.round = {
          ...round,
          status: "FLYING",
          startedAt: Date.now(),
        };
        this.state.bets = this.state.bets.map((b) =>
          b.status === "PENDING" ? { ...b, status: "ACTIVE" } : b,
        );
      }
    } else if (round.status === "FLYING") {
      const next = Math.exp(elapsed / 11000);
      this.state.bets = this.state.bets.map((b) => {
        if (b.status !== "ACTIVE") return b;
        if (b.autoCashOut && b.autoCashOut <= Math.min(next, this.crashAt)) {
          const win = Math.floor(b.amount * b.autoCashOut);
          this.state.balance += win;
          return {
            ...b,
            status: "CASHED_OUT",
            cashOutMultiplier: b.autoCashOut,
            potentialWin: win,
          };
        }
        return { ...b, potentialWin: Math.floor(b.amount * next) };
      });
      this.state.round = { ...round, multiplier: Math.min(next, this.crashAt) };
      if (next >= this.crashAt) {
        this.phaseStart = Date.now();
        this.state.round = {
          ...this.state.round,
          status: "CRASHED",
          crashMultiplier: this.crashAt,
          endedAt: Date.now(),
        };
        this.state.history = [this.crashAt, ...this.state.history].slice(0, 30);
        this.state.bets = this.state.bets.map((b) =>
          b.status === "ACTIVE" ? { ...b, status: "LOST", potentialWin: 0 } : b,
        );
      }
    } else if (elapsed >= 3500) {
      this.phaseStart = Date.now();
      this.crashAt =
        Math.random() < 0.15
          ? 10 + Math.random() * 8
          : 1.15 + Math.random() * 5;
      const number = round.roundNumber + 1;
      this.state.round = {
        id: `round-${number}`,
        roundNumber: number,
        status: "WAITING",
        multiplier: 1,
        crashMultiplier: 0,
        startedAt: null,
        endedAt: null,
      };
      this.state.countdown = 6;
      this.state.players = makePlayers();
      this.state.auto.forEach((a, panel) => {
        if (a.enabled) {
          try {
            this.placeBet(panel, a.amount, a.cashOut ? a.target : undefined);
          } catch {
            this.state.auto = this.state.auto.map((s, i) =>
              i === panel ? { ...s, enabled: false } : s,
            );
          }
        }
      });
    }
    this.publish();
  };
  placeBet = (panel: number, amount: number, autoCashOut?: number) => {
    if (!["WAITING", "BETTING"].includes(this.state.round.status))
      throw new Error("Betting opens next round");
    if (!Number.isFinite(amount) || amount < 100 || amount > 1000000)
      throw new Error("Enter an amount from 100 to 1,000,000 RWF");
    if (
      autoCashOut !== undefined &&
      (!Number.isFinite(autoCashOut) || autoCashOut < 1.01 || autoCashOut > 100)
    )
      throw new Error("Auto cash out must be between 1.01x and 100x");
    if (
      this.state.bets.some(
        (b) =>
          b.panel === panel &&
          b.roundNumber === this.state.round.roundNumber &&
          b.status !== "CANCELLED",
      )
    )
      throw new Error("One bet per panel per round");
    if (amount > this.state.balance)
      throw new Error("Insufficient demo balance");
    this.state.balance -= amount;
    const bet: Bet = {
      id: crypto.randomUUID(),
      userId: "you",
      panel,
      roundNumber: this.state.round.roundNumber,
      amount,
      autoCashOut,
      potentialWin: amount,
      status: "PENDING",
    };
    this.state.bets = [bet, ...this.state.bets].slice(0, 200);
    this.publish();
  };
  cancelBet = (panel: number) => {
    this.state.bets = this.state.bets.map((b) => {
      if (b.panel === panel && b.status === "PENDING") {
        this.state.balance += b.amount;
        return { ...b, status: "CANCELLED" };
      }
      return b;
    });
    this.publish();
  };
  cashOut = (panel: number) => {
    if (this.state.round.status !== "FLYING") return;
    this.state.bets = this.state.bets.map((b) => {
      if (b.panel === panel && b.status === "ACTIVE") {
        const win = Math.floor(b.amount * this.state.round.multiplier);
        this.state.balance += win;
        return {
          ...b,
          status: "CASHED_OUT",
          cashOutMultiplier: this.state.round.multiplier,
          potentialWin: win,
        };
      }
      return b;
    });
    this.publish();
  };
  configureAuto = (panel: number, settings: AutoSettings) => {
    this.state.auto = this.state.auto.map((a, i) =>
      i === panel ? settings : a,
    );
    this.publish();
  };
  addDemoFunds = () => {
    this.state.balance += 10000;
    this.publish();
  };
}

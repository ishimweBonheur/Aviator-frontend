import type { Bet, AutoSettings } from "@/features/betting/types/betting.types";
import type { PlayerBet } from "@/features/bets/types/live-bet.types";
export type GameStatus = "WAITING" | "BETTING" | "FLYING" | "CRASHED";
export interface GameRound {
  id: string;
  roundNumber: number;
  status: GameStatus;
  multiplier: number;
  crashMultiplier: number;
  startedAt: number | null;
  endedAt: number | null;
}
export interface GameSnapshot {
  limits?: { MinBet: string; MaxBet: string; MaxPayout: string };
  mode?: "demo" | "backend";
  connection?: "connecting" | "connected" | "offline";
  error?: string;
  user?: { id: number; username: string; email: string; role?: "PLAYER" | "ADMIN" };
  balanceLoaded?: boolean;
  bettingRound?: { id: string; roundNumber: number };
  pendingPanels?: number[];
  round: GameRound;
  countdown: number;
  balance: number;
  bets: Bet[];
  history: number[];
  players: PlayerBet[];
  auto: AutoSettings[];
}

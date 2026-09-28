import type { Bet, AutoSettings } from "@/features/betting/types/betting.types";
import type { SessionUser } from "@/features/auth/services/session";
export type GameStatus =
  "WAITING" | "BETTING" | "BETTING_CLOSED" | "FLYING" | "CRASHED";
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

  connection?: "connecting" | "connected" | "offline";
  error?: string;
  user?: SessionUser;
  balanceLoaded?: boolean;
  bettingRound?: { id: string; roundNumber: number };
  pendingPanels?: number[];
  round: GameRound;
  countdown: number;
  balance: number;
  bets: Bet[];
  history: number[];
  auto: AutoSettings[];
}

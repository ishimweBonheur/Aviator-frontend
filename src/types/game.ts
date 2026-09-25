export type GameStatus = "WAITING" | "BETTING" | "FLYING" | "CRASHED";
export type BetStatus =
  "PENDING" | "ACTIVE" | "CASHED_OUT" | "LOST" | "CANCELLED" | "UNKNOWN";
export interface GameRound {
  id: string;
  roundNumber: number;
  status: GameStatus;
  multiplier: number;
  crashMultiplier: number;
  startedAt: number | null;
  endedAt: number | null;
}
export interface Bet {
  roundId?: string;
  id: string;
  userId: string;
  panel: number;
  roundNumber: number;
  amount: number;
  autoCashOut?: number;
  cashOutMultiplier?: number;
  potentialWin: number;
  status: BetStatus;
}
export interface AutoSettings {
  enabled: boolean;
  cashOut: boolean;
  target: number;
  amount: number;
}
export interface PlayerBet {
  id: number;
  name: string;
  amount: number;
  target: number;
  color: string;
}
export interface GameSnapshot {
  limits?: {MinBet:string;MaxBet:string;MaxPayout:string};
  mode?: "demo" | "backend";
  connection?: "connecting" | "connected" | "offline";
  error?: string;
  user?: { id: number; username: string; email: string };
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

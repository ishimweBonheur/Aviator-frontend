export type BetStatus =
  "PENDING" | "ACTIVE" | "CASHED_OUT" | "LOST" | "CANCELLED" | "UNKNOWN";
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

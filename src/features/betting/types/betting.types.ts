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
  canCancel?: boolean;
  canCashout?: boolean;
  status: BetStatus;
}
export interface AutoSettings {
  enabled: boolean;
  error?: string;
  cashOut: boolean;
  target: number;
  amount: number;
}

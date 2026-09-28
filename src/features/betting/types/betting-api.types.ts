import type { ApiRound } from "@/features/game/types/game-api.types";
export interface ApiAutoSetting {
  bet_number: number;
  enabled: boolean;
  amount: string;
  auto_cashout_multiplier: string | null;
  last_error: string;
  last_round_id: number;
}
export interface ApiBet {
  potential_payout: string;
  can_cancel: boolean;
  can_cashout: boolean;
  auto_cashout_multiplier?: string;
  id: number;
  round_id: number;
  user_id: number;
  bet_number: number;
  amount: string;
  status: "ACTIVE" | "CANCELLED" | "CASHED_OUT" | "LOST";
  round_number: number;
  round_status: ApiRound["status"];
  cashout_multiplier?: string;
  payout: string;
}
export interface CashoutResponse {
  bet_id: number;
  multiplier: string;
  payout: string;
  remaining_balance: string;
}

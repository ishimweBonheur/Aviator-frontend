export interface ApiUser {
  ID: number;
  Username: string;
  Email: string;
  Role?: "PLAYER" | "ADMIN";
}
export interface ApiRound {
  id: number;
  round_number: number;
  status:
    | "CREATED"
    | "BETTING_OPEN"
    | "BETTING_CLOSED"
    | "RUNNING"
    | "CRASHED"
    | "SETTLED";
  betting_closes_at?: string;
  server_seed_hash: string;
  server_seed?: string;
  client_seed: string;
  nonce: number;
  house_edge?: string;
  started_at?: string;
  ended_at?: string;
  crash_point?: string;
}
export interface ApiBet {
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
export interface RoundEvent {
  seconds_remaining?: number;
  betting_closes_at?: string;
  timestamp?: string;
  type:
    | "COUNTDOWN"
    | "BET_PLACED"
    | "BET_CANCELLED"
    | "BET_CASHED_OUT"
    | "ROUND_OPENED"
    | "ROUND_STARTED"
    | "MULTIPLIER_UPDATE"
    | "ROUND_CRASHED"
    | "ROUND_SETTLED";
  round_id: number;
  round_number: number;
  multiplier?: string;
  crash_point?: string;
}

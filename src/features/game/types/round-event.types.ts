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

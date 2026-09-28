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

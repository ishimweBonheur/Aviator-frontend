export interface ApiUser {
  ID: number;
  Username: string;
  Email: string;
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
    | "COUNTDOWN" | "BET_PLACED" | "BET_CANCELLED" | "BET_CASHED_OUT"
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
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Backend unavailable or request timed out. Check your connection.",
      0,
    );
  }
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : text.trim();
    throw new ApiError(
      message || `Request failed (${response.status})`,
      response.status,
    );
  }
  if (data === undefined)
    throw new ApiError("Backend returned an invalid JSON response.", 0);
  return data as T;
}
export const api = {
  cancel: (token:string,id:string) => request<{status:string}>("/api/bets/"+id+"/cancel",{method:"POST",token}),
  bets: (token:string) => request<ApiBet[]>("/api/bets",{token}),
  rounds: () => request<ApiRound[]>("/api/game/rounds"),
  fairness: (id:number) => request<ApiRound>("/api/game/rounds/"+id+"/fairness"),
  limits: () => request<{MinBet:string;MaxBet:string;MaxPayout:string}>("/api/limits"),
  health: () => request<{ status: string }>("/health"),
  register: (username: string, email: string, password: string) =>
    request<{ user: ApiUser }>("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  balance: (token: string) =>
    request<{ user_id: number; balance: string }>("/api/wallet/balance", {
      token,
    }),
  currentRound: () => request<{running: ApiRound | null; upcoming: ApiRound | null; current_multiplier?: string; server_time:string}>("/api/game/rounds/current"),
  round: (id: number) => request<ApiRound>(`/api/game/rounds/${id}`),
  placeBet: (token: string, roundId: number, panel: number, amount: number) =>
    request<{ bet: ApiBet }>("/api/bets", {
      method: "POST",
      token,
      body: {
        round_id: roundId,
        bet_number: panel + 1,
        amount: amount.toFixed(2),
      },
    }),
  cashOut: (token: string, betId: string) =>
    request<CashoutResponse>(`/api/bets/${betId}/cashout`, { method: "POST", token }),
};
export function websocketUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const url = new URL("/ws", base || window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

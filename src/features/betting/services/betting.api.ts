import { request } from "@/services/api";
import type { ApiBet, CashoutResponse } from "@/types/api.types";
export const bettingApi = {
  cancel: (token: string, id: string) =>
    request<{ status: string }>("/api/bets/" + id + "/cancel", {
      method: "POST",
      token,
    }),
  bets: (token: string) => request<ApiBet[]>("/api/bets", { token }),
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
    request<CashoutResponse>(`/api/bets/${betId}/cashout`, {
      method: "POST",
      token,
    }),
};

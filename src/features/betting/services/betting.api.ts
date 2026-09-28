import { request } from "@/services/api";
import type {
  ApiBet,
  CashoutResponse,
  ApiAutoSetting,
} from "@/features/betting/types/betting-api.types";
export const bettingApi = {
  autoSettings: (token: string) =>
    request<ApiAutoSetting[]>("/api/bets/auto", { token }),
  saveAutoSettings: (
    token: string,
    panel: number,
    body: {
      enabled: boolean;
      amount: string;
      auto_cashout_multiplier: string | null;
    },
  ) =>
    request<ApiAutoSetting[]>(`/api/bets/auto/${panel + 1}`, {
      token,
      body,
      method: "PUT",
    }),
  cancel: (token: string, id: string) =>
    request<{ status: string }>("/api/bets/" + id + "/cancel", {
      method: "POST",
      token,
    }),
  bets: (token: string) => request<ApiBet[]>("/api/bets", { token }),
  placeBet: (
    token: string,
    roundId: number,
    panel: number,
    amount: number,
    autoCashout?: number,
  ) =>
    request<{ bet: ApiBet }>("/api/bets", {
      method: "POST",
      token,
      body: {
        round_id: roundId,
        bet_number: panel + 1,
        amount: amount.toFixed(2),
        ...(autoCashout !== undefined
          ? { auto_cashout_multiplier: autoCashout.toFixed(2) }
          : {}),
      },
    }),
  cashOut: (token: string, betId: string) =>
    request<CashoutResponse>(`/api/bets/${betId}/cashout`, {
      method: "POST",
      token,
    }),
};

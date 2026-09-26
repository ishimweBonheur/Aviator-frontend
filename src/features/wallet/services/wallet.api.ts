import { request } from "@/services/api";
export const walletApi = {
  balance: (token: string) =>
    request<{ user_id: number; balance: string }>("/api/wallet/balance", {
      token,
    }),
};

import { request } from "@/services/api";
import { authenticatedRequest } from "@/features/auth/services/session";
import type { WalletEntry, WalletResource } from "../types/wallet.types";
const listeners = new Set<() => void>();
const resourcePath = (resource: WalletResource) =>
  resource === "transactions" ? "/api/wallet/transactions" : "/api/" + resource;
export const walletApi = {
  balance: (token: string) =>
    request<{ user_id: number; balance: string }>("/api/wallet/balance", {
      token,
    }),
  activity: (resource: WalletResource) =>
    authenticatedRequest<WalletEntry[]>(resourcePath(resource)),
  submit: async (
    resource: Exclude<WalletResource, "transactions">,
    body: { amount: string; provider: string },
  ) => {
    try {
      return await authenticatedRequest<
        WalletEntry | { withdrawal: WalletEntry }
      >(resourcePath(resource), body);
    } finally {
      listeners.forEach((listener) => listener());
    }
  },
  subscribeChanges: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

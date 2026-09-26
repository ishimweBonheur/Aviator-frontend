import { gameApi } from "@/features/game/services/game.api";
import { bettingApi } from "@/features/betting/services/betting.api";
import { authApi } from "@/features/auth/services/auth.api";
import { walletApi } from "@/features/wallet/services/wallet.api";
import { request } from "./api";
// Facade used by the existing shared backend state owner.
export const api = {
  ...gameApi,
  ...bettingApi,
  ...authApi,
  ...walletApi,
  health: () => request<{ status: string }>("/health"),
};

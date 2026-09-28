import { gameApi } from "@/features/game/services/game.api";
import { bettingApi } from "@/features/betting/services/betting.api";
import { walletApi } from "@/features/wallet/services/wallet.api";
// Facade used by the existing shared backend state owner.
export const api = {
  ...gameApi,
  ...bettingApi,
  ...walletApi,
};

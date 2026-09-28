import type { GameSnapshot } from "./game.types";
import type { AutoSettings } from "@/features/betting/types/betting.types";

export interface GameService {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => GameSnapshot;
  placeBet: (
    panel: number,
    amount: number,
    autoCashOut?: number,
  ) => void | Promise<void>;
  cancelBet: (panel: number) => void | Promise<void>;
  cashOut: (panel: number) => void | Promise<void>;
  configureAuto: (
    panel: number,
    settings: AutoSettings,
  ) => void | Promise<void>;

  refresh: () => Promise<void>;
}

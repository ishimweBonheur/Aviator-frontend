import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { GameSnapshot } from "@/features/game/types/game.types";

import type { AppModal } from "@/types/app.types";
export interface AppState {
  game: GameSnapshot;
  backend: boolean;
  modal: AppModal;
  setModal: Dispatch<SetStateAction<AppModal>>;
  reduced: boolean;
  setReduced: Dispatch<SetStateAction<boolean>>;
  sound: { enabled: boolean; toggle: () => void };
}
export const AppContext = createContext<AppState | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used within AppProviders");
  return value;
}

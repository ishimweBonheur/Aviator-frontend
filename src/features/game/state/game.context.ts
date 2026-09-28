import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { GameSnapshot } from "@/features/game/types/game.types";

import type { AppModal } from "@/features/game/state/game-ui.types";
export interface GameContextState {
  game: GameSnapshot;

  modal: AppModal;
  setModal: Dispatch<SetStateAction<AppModal>>;
  reduced: boolean;
  setReduced: Dispatch<SetStateAction<boolean>>;
  sound: { enabled: boolean; toggle: () => void };
}
export const GameContext = createContext<GameContextState | null>(null);
export function useGameContext() {
  const value = useContext(GameContext);
  if (!value)
    throw new Error("useGameContext must be used within GameProvider");
  return value;
}

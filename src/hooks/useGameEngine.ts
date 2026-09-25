import { useSyncExternalStore } from "react";
import { gameService } from "../services/gameService";
export const useGameEngine = () =>
  useSyncExternalStore(gameService.subscribe, gameService.getSnapshot);

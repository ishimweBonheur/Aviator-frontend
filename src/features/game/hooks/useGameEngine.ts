import { useSyncExternalStore } from "react";
import { gameService } from "@/features/game/services/game.service";
export const useGameEngine = () =>
  useSyncExternalStore(gameService.subscribe, gameService.getSnapshot);

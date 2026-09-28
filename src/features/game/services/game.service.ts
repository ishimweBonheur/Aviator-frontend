import { BackendGameService } from "./backendGameService";
import type { GameService } from "@/features/game/types/game-service.types";
export const gameService: GameService = new BackendGameService();

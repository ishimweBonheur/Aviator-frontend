import { BackendGameService } from "./backendGameService";
import { DemoGameService } from "./demoGameService";
import type { GameService } from "@/features/game/types/game-service.types";
export const isBackend =
  (localStorage.getItem("altitude-mode") ??
    import.meta.env.VITE_GAME_MODE ??
    "backend") !== "demo";
export const gameService: GameService = isBackend
  ? new BackendGameService()
  : new DemoGameService();
export function switchMode(mode: "demo" | "backend") {
  localStorage.setItem("altitude-mode", mode);
  window.location.reload();
}

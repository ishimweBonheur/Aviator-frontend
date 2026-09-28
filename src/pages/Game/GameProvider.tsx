import { useState, type ReactNode } from "react";
import { GameContext } from "@/features/game/state/game.context";
import type { AppModal } from "@/features/game/state/game-ui.types";
import { useGameEngine } from "@/features/game/hooks/useGameEngine";
import { useGameNotifications } from "@/features/game/hooks/useGameNotifications";
import { useSound } from "@/features/game/hooks/useSound";
export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGameEngine();

  const [modal, setModal] = useState<AppModal>(null);
  const [reduced, setReduced] = useState(false);
  const sound = useSound(
    game.round.status,
    game.bets.filter((b) => b.status === "CASHED_OUT").length,
  );
  useGameNotifications(game);
  return (
    <GameContext.Provider
      value={{ game, modal, setModal, reduced, setReduced, sound }}
    >
      {children}
    </GameContext.Provider>
  );
}

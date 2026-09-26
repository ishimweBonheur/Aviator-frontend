import { useState, type ReactNode } from "react";
import { AppContext } from "@/store/app.store";
import type { AppModal } from "@/types/app.types";
import { useGameEngine } from "@/features/game/hooks/useGameEngine";
import { useGameNotifications } from "@/features/game/hooks/useGameNotifications";
import { useSound } from "@/hooks/useSound";
export function AppProviders({ children }: { children: ReactNode }) {
  const game = useGameEngine();
  const backend = game.mode === "backend";
  const [modal, setModal] = useState<AppModal>(null);
  const [reduced, setReduced] = useState(false);
  const sound = useSound(
    game.round.status,
    game.bets.filter((b) => b.status === "CASHED_OUT").length,
  );
  useGameNotifications(game);
  return (
    <AppContext.Provider
      value={{ game, backend, modal, setModal, reduced, setReduced, sound }}
    >
      {children}
    </AppContext.Provider>
  );
}

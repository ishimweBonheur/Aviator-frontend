import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { currency } from "@/utils/format";
import type { GameSnapshot } from "@/features/game/types/game.types";

export function useGameNotifications(game: GameSnapshot) {
  const previous = useRef(new Map<string, string>());
  const previousStatus = useRef(game.round.status);
  useEffect(() => {
    game.bets.forEach((b) => {
      if (
        b.status === "CASHED_OUT" &&
        previous.current.get(b.id) !== "CASHED_OUT"
      )
        toast.success(
          `Cashed out at ${b.cashOutMultiplier?.toFixed(2)}x · Won ${currency(b.potentialWin)} RWF`,
        );
      previous.current.set(b.id, b.status);
    });
    if (game.round.status === "CRASHED" && previousStatus.current !== "CRASHED")
      toast(`Round crashed at ${game.round.multiplier.toFixed(2)}x`);
    previousStatus.current = game.round.status;
  }, [game]);
}

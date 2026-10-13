import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { currency } from "@/utils/format";
import type { GameSnapshot } from "@/features/game/types/game.types";
import type { BetStatus } from "@/features/betting/types/betting.types";

export function useGameNotifications(game: GameSnapshot) {
  const previous = useRef(new Map<string, BetStatus>());
  const previousUser = useRef(game.user?.id);
  useEffect(() => {
    const userId = game.user?.id;
    if (previousUser.current !== userId || userId === undefined) {
      previous.current.clear();
      previousUser.current = userId;
    }
    if (userId === undefined) return;

    const next = new Map<string, BetStatus>();
    game.bets.forEach((bet) => {
      if (bet.userId !== String(userId)) return;
      const status = previous.current.get(bet.id);
      // History arrives after login: only announce bets seen in progress.
      if (
        bet.status === "CASHED_OUT" &&
        (status === "ACTIVE" || status === "PENDING" || status === "UNKNOWN")
      ) {
        toast.success(
          `Cashed out at ${bet.cashOutMultiplier?.toFixed(2)}x · Won ${currency(bet.potentialWin)} RWF`,
          { id: `cash-out-${userId}-${bet.id}` },
        );
      }
      next.set(bet.id, bet.status);
    });
    previous.current = next;
  }, [game.bets, game.user?.id]);
}

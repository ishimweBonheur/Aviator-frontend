import { useState } from "react";
import { toast } from "sonner";
import type { GameSnapshot } from "@/features/game/types/game.types";

import { gameService } from "@/features/game/services/game.service";
import { currency } from "@/utils/format";
export function useBet(panel: number, game: GameSnapshot) {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const settings = game.auto[panel];

  const busy = !!game.pendingPanels?.includes(panel);
  const active = game.bets.find(
    (b) =>
      b.panel === panel &&
      b.roundId === game.round.id &&
      ["ACTIVE", "UNKNOWN"].includes(b.status),
  );
  const bet =
    active ??
    game.bets.find(
      (b) => b.panel === panel && b.roundId === game.bettingRound?.id,
    ) ??
    (!game.bettingRound
      ? game.bets.find((b) => b.panel === panel && b.roundId === game.round.id)
      : undefined);
  const open =
    game.round.status === "BETTING" &&
    game.countdown > 0 &&
    !!game.bettingRound &&
    game.connection === "connected" &&
    !!game.user &&
    !!game.balanceLoaded;
  const locked = !!bet || busy || settings.enabled;
  const configure = (update: Partial<typeof settings>) =>
    void Promise.resolve(
      gameService.configureAuto(panel, { ...settings, ...update }),
    ).catch((error: Error) => toast.error(error.message));
  const action = async () => {
    try {
      if (bet?.status === "PENDING") {
        await gameService.cancelBet(panel);
        toast("Bet cancelled. Funds refunded.");
      } else if (bet?.status === "ACTIVE") await gameService.cashOut(panel);
      else {
        await gameService.placeBet(
          panel,
          settings.amount,
          settings.cashOut ? settings.target : undefined,
        );
        toast.success(
          `Bet ${panel + 1} placed · ${currency(settings.amount)} RWF`,
        );
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const label = busy
    ? "Processing…"
    : bet?.status === "UNKNOWN"
      ? "Unconfirmed"
      : !game.user
        ? "Sign in first"
        : !bet && open
          ? `Bet for #${game.bettingRound!.roundNumber}`
          : bet?.status === "PENDING"
            ? "Cancel bet"
            : bet?.status === "ACTIVE"
              ? "Cash out"
              : bet?.status === "CASHED_OUT"
                ? "Bet won"
                : bet?.status === "LOST"
                  ? "Bet lost"
                  : bet?.status === "CANCELLED"
                    ? "Cancelled"
                    : open
                      ? "Place bet"
                      : "Next round";

  return {
    mode,
    setMode,
    settings,
    busy,
    bet,
    open,
    locked,
    configure,
    action,
    label,
  };
}

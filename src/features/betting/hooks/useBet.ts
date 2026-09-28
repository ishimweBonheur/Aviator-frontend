import { useState } from "react";
import { toast } from "sonner";
import type { GameSnapshot } from "@/features/game/types/game.types";

import { gameService } from "@/features/game/services/game.service";
import { currency } from "@/utils/format";
export function useBet(panel: number, game: GameSnapshot) {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const settings = game.auto[panel];

  const busy = !!game.pendingPanels?.includes(panel);
  const currentBet = game.bets.find(
    (b) => b.panel === panel && b.roundId === game.round.id,
  );
  const queuedBet = game.bets.find(
    (b) =>
      b.panel === panel &&
      b.roundId === game.bettingRound?.id &&
      b.status !== "CANCELLED",
  );
  const runningBet =
    game.round.status === "FLYING" &&
    currentBet &&
    ["ACTIVE", "UNKNOWN"].includes(currentBet.status)
      ? currentBet
      : undefined;
  const bet =
    runningBet ?? queuedBet ?? (!game.bettingRound ? currentBet : undefined);
  const open =
    !!game.bettingRound?.open &&
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
  const label =
    bet?.status === "PENDING" ||
    (busy && bet?.status === "UNKNOWN" && bet.roundId === game.bettingRound?.id)
      ? "CANCEL"
      : bet?.status === "ACTIVE"
        ? "CASH OUT"
        : "BET";
  const resultBet =
    currentBet && ["CASHED_OUT", "LOST"].includes(currentBet.status)
      ? currentBet
      : bet;
  const finished =
    resultBet?.status === "CASHED_OUT"
      ? "Bet won"
      : resultBet?.status === "LOST"
        ? "Bet lost"
        : bet?.status === "CANCELLED"
          ? "Cancelled"
          : bet?.status === "UNKNOWN" && !busy
            ? "Bet unconfirmed"
            : undefined;

  return {
    currentBet,
    queuedBet,
    finished,
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

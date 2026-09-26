import type { PlayerBet } from "@/features/bets/types/live-bet.types";

export const makePlayers = (): PlayerBet[] =>
  Array.from({ length: 22 }, (_, id) => ({
    id,
    name: [
      "ka***23",
      "jo***91",
      "al***54",
      "ma***07",
      "ni***82",
      "el***36",
      "sa***19",
      "ch***42",
    ][id % 8],
    amount: [500, 1000, 2500, 5000, 200, 10000][Math.floor(Math.random() * 6)],
    target: 1.15 + Math.random() * 5,
    color: ["#ba85ed", "#e3b578", "#80b5df", "#dc8297"][id % 4],
  }));

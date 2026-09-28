import type { GameSnapshot } from "@/features/game/types/game.types";
import { BetPanel } from "./BetPanel";
export function BettingSection({ game }: { game: GameSnapshot }) {
  return (
    <div className="bet-panels">
      {[0, 1].map((panel) => (
        <BetPanel key={panel} panel={panel} game={game} />
      ))}
    </div>
  );
}

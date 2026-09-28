import type { GameSnapshot } from "@/features/game/types/game.types";
import { BetPanel } from "./BetPanel";
export function BettingSection({ game }: { game: GameSnapshot }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 max-[600px]:grid-cols-1 max-[600px]:gap-3">
      {[0, 1].map((panel) => (
        <BetPanel key={panel} panel={panel} game={game} />
      ))}
    </div>
  );
}

import { useApp } from "@/store/app.store";
import { BetPanel } from "./BetPanel";
export function BettingSection() {
  const { game } = useApp();
  return (
    <div className="bet-panels">
      {[0, 1].map((panel) => (
        <BetPanel key={panel} panel={panel} game={game} />
      ))}
    </div>
  );
}

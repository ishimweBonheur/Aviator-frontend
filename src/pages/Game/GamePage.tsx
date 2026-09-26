import { useApp } from "@/store/app.store";
import { GameLayout } from "@/layouts/GameLayout";
import { GameHeading } from "@/features/game/components/GameHeading";
import { RoundHistory } from "@/features/game/components/RoundHistory";
import { GameCanvas } from "@/features/game/components/GameCanvas";
import { GameInfo } from "@/features/game/components/GameInfo";
import { GameStats } from "@/features/game/components/GameStats";
import { FlightTip } from "@/features/game/components/FlightTip";
import { BettingSection } from "@/features/betting/components/BettingSection";
import { LiveBets } from "@/features/bets/components/LiveBets";
export function GamePage() {
  const { game } = useApp();
  return (
    <>
      <GameHeading />
      <GameLayout bets={<LiveBets game={game} />}>
        <RoundHistory />
        <GameCanvas game={game} />
        <GameInfo />
        <BettingSection />
        <GameStats />
        <FlightTip />
      </GameLayout>
    </>
  );
}

import { MainLayout } from "@/layouts/MainLayout";
import { GameProvider } from "./GameProvider";
import { useGameContext } from "@/features/game/state/game.context";
import { GameLayout } from "@/layouts/GameLayout";
import { RoundHistory } from "@/features/game/components/RoundHistory";
import { GameCanvas } from "@/features/game/components/GameCanvas";
import { GameInfo } from "./components/GameInfo";
import { BettingSection } from "@/features/betting/components/BettingSection";
import { LiveBets } from "@/features/bets/components/LiveBets";
function GameContent() {
  const { game } = useGameContext();
  return (
    <>
     
      <GameLayout bets={<LiveBets game={game} />}>
        <RoundHistory />
        <GameCanvas game={game} />
        <GameInfo />
        <BettingSection game={game} />

      </GameLayout>
    </>
  );
}

export function GamePage() {
  return (
    <GameProvider>
      <MainLayout>
        <GameContent />
      </MainLayout>
    </GameProvider>
  );
}

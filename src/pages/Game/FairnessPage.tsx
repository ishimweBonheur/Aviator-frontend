import { GameProvider } from "./GameProvider";
import { MainLayout } from "@/layouts/MainLayout";
import { FairnessView } from "@/features/game/components/FairnessView";
export function FairnessPage() {
  return (
    <GameProvider>
      <MainLayout>
        <section className="mx-auto max-w-3xl rounded-xl border border-[#2c2e39] bg-[#191a22] p-5">
          <a href="/" className="text-xs text-admin-link">
            Back to game
          </a>
          <h1 className="my-4 text-2xl">Provably fair</h1>
          <FairnessView />
        </section>
      </MainLayout>
    </GameProvider>
  );
}

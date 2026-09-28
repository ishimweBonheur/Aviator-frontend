import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { useGameContext } from "@/features/game/state/game.context";
import { Header } from "@/layouts/player/Header";
import { Footer } from "@/layouts/player/Footer";
import { GameDialogs } from "@/pages/Game/GameDialogs";
export function MainLayout({ children }: { children: ReactNode }) {
  const { reduced } = useGameContext();
  return (
    <div className={`app min-h-screen ${reduced ? "reduce-motion" : ""}`}>
      <Header />
      <main>
        {children}
        <Footer />
      </main>
      <GameDialogs />
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}

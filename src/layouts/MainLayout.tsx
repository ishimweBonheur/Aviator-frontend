import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { useGameContext } from "@/features/game/state/game.context";
import { Header } from "@/layouts/player/Header";
import { Footer } from "@/layouts/player/Footer";
import { GameDialogs } from "@/pages/Game/GameDialogs";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { reduced } = useGameContext();

  return (
    <div
      className={`
        bg-[radial-gradient(ellipse_at_45%_5%,#23172033,transparent_45%)]

        ${reduced ? "reduce-motion" : ""}
      `}
    >
      <Header />

      <main
        className="
          w-full
          px-[3.2%]
          pt-5
          pb-1

          min-[1440px]:pt-6

          max-[900px]:px-6.25
          max-[900px]:pt-5
          max-[900px]:pb-1

          max-[600px]:px-3.5
          max-[600px]:pt-4
          max-[600px]:pb-1
        "
      >
        {children}
        <Footer />
      </main>
      <GameDialogs />
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}

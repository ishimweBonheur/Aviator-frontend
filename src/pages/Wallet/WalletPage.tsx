import { GameProvider } from "../Game/GameProvider";
import { MainLayout } from "@/layouts/MainLayout";
import { useGameContext } from "@/features/game/state/game.context";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { WalletActivity } from "@/features/wallet/components/WalletActivity";
import { WalletTransactions } from "@/features/wallet/components/WalletTransactions";
import { WalletNavigation } from "@/features/wallet/components/WalletNavigation";
import type { WalletResource } from "@/features/wallet/types/wallet.types";
function Content({ kind }: { kind: WalletResource }) {
  const { game } = useGameContext();
  return (
    <section className="mx-auto max-w-6xl rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[600px]:p-3.5">
      <a href="/" className="text-xs text-admin-link">
        Back to game
      </a>
      <h1 className="my-4 text-2xl">{kind[0].toUpperCase() + kind.slice(1)}</h1>
      <WalletNavigation active={kind} />
      {!game.user ? (
        <AuthForm />
      ) : kind === "transactions" ? (
        <WalletTransactions />
      ) : (
        <WalletActivity kind={kind} navigation={false} />
      )}
    </section>
  );
}
export function WalletPage({ kind }: { kind: WalletResource }) {
  return (
    <GameProvider>
      <MainLayout>
        <Content kind={kind} />
      </MainLayout>
    </GameProvider>
  );
}

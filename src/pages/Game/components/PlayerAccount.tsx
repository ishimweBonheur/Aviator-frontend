import { WalletActivity } from "@/features/wallet/components/WalletActivity";
import { useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { session } from "@/features/auth/services/session";
import type { GameSnapshot } from "@/features/game/types/game.types";

import { gameService } from "@/features/game/services/game.service";
import { currency } from "@/utils/format";

export function PlayerAccount({
  game,
  wallet = false,
}: {
  game: GameSnapshot;
  wallet?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  if (game.user)
    return (
      <>
        <div className="flex items-center gap-[15px] py-[25px]">
          <span className="grid h-[33px] w-[33px] place-items-center rounded-full border border-[#69404b] bg-[#3d2b31] text-[10px] text-[#f1b8c5]">
            {game.user.username.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{game.user.username}</strong>
            <small className="mt-1.5 block text-[10px] text-[#9f8cac]">
              {game.user.email}
            </small>
          </div>
        </div>
        <div className="my-6 rounded-[9px] border border-[#332b3b] bg-[#141319] p-[22px]">
          <small className="block text-[9px] tracking-[1px] text-[#9987a5]">
            BACKEND WALLET BALANCE
          </small>
          <strong className="mt-2.5 block text-[30px]">
            {game.balanceLoaded ? currency(game.balance) : "—"}{" "}
            <span className="text-sm text-[#9d8cab]">RWF</span>
          </strong>
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-brand-btn p-3.5 font-semibold"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await gameService.refresh?.();
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCw size={16} />
          {busy ? "Refreshing…" : "Refresh balance"}
        </button>
        {wallet && <WalletActivity />}
        <button
          className="mt-[13px] flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#4c3a53] bg-[#28202f] p-3 text-xs"
          onClick={() => session.logout()}
        >
          <LogOut size={15} /> Sign out on this device
        </button>
        <p className="mt-4 text-center! text-[10px]! text-[#81708e]!">
          Your bets and wallet history are loaded from your account.
        </p>
      </>
    );
  return <AuthForm />;
}

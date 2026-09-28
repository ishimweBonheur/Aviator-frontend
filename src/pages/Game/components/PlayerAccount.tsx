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
        <div className="profile-card">
          <span className="profile-button">
            {game.user.username.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{game.user.username}</strong>
            <small>{game.user.email}</small>
          </div>
        </div>
        <div className="modal-balance">
          <small>BACKEND WALLET BALANCE</small>
          <strong>
            {game.balanceLoaded ? currency(game.balance) : "—"} <span>RWF</span>
          </strong>
        </div>
        <button
          className="primary-button"
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
        <button className="secondary-button" onClick={() => session.logout()}>
          <LogOut size={15} /> Sign out on this device
        </button>
        <p className="modal-note">
          Your bets and wallet history are loaded from your account.
        </p>
      </>
    );
  return <AuthForm />;
}

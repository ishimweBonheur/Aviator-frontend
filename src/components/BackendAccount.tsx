import { WalletActivity } from "./WalletActivity";
import { useState } from "react";
import { LogIn, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { GameSnapshot } from "../types/game";
import { gameService } from "../services/gameService";
import { currency } from "../utils/format";

export function BackendAccount({
  game,
  wallet = false,
}: {
  game: GameSnapshot;
  wallet?: boolean;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
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
        <button
          className="secondary-button"
          onClick={() => gameService.logout?.()}
        >
          <LogOut size={15} /> Sign out on this device
        </button>
        <p className="modal-note">
          Your bets and wallet history are loaded from your account.
        </p>
      </>
    );
  return (
    <form
      className="account-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError("");
        try {
          if (register) {
            await gameService.register?.(
              String(data.get("username")).trim(),
              email.trim(),
              String(data.get("password")),
            );
            setRegister(false);
            toast.success("Account created. Sign in to continue.");
          } else {
            await gameService.login?.(
              email.trim(),
              String(data.get("password")),
            );
            toast.success("Signed in");
          }
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        {register
          ? "Create an account on your Aviator backend."
          : "Sign in to use your backend wallet and place bets."}
      </p>
      {register && (
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            maxLength={50}
            required
            disabled={busy}
          />
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : 1}
          required
          disabled={busy}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button" disabled={busy}>
        <LogIn size={16} />
        {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
      </button>
      <button
        type="button"
        className="secondary-button"
        disabled={busy}
        onClick={() => {
          setRegister(!register);
          setError("");
        }}
      >
        {register
          ? "Already registered? Sign in"
          : "New here? Create an account"}
      </button>
    </form>
  );
}

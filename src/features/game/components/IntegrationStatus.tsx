import { useState } from "react";
import { gameApi as api } from "../services/game.api";
import type { ApiRound } from "@/features/game/types/game-api.types";

export function IntegrationStatus() {
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<ApiRound>();
  const [error, setError] = useState("");
  return (
    <>
      <p>
        Connected features follow the routes implemented in your Go backend.
      </p>
      <ul className="integration-list">
        <li>
          <strong>Connected</strong> Registration, login, wallet balance, place
          bet, cancellation, cash out, funding, history, fairness and realtime
          events, automatic bets and automatic cashouts.
        </li>
        <li>
          <strong>Still needed</strong> Real external payment provider
          integration.
        </li>
        <li>
          <strong>Persistent history</strong> Recent completed rounds and your
          account bets. No fabricated player totals are shown in backend mode.
        </li>
      </ul>
      <form
        className="account-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const id = Number(new FormData(event.currentTarget).get("round"));
          setBusy(true);
          setError("");
          setRound(undefined);
          try {
            const result = await api.round(id);
            setRound(result);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Look up round ID
          <input
            name="round"
            type="number"
            min="1"
            step="1"
            required
            disabled={busy}
          />
        </label>
        <button className="secondary-button" disabled={busy}>
          {busy ? "Looking up…" : "Look up round"}
        </button>
      </form>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {round && (
        <div className="info-box">
          Round #{round.round_number} · {round.status}
          {["CRASHED", "SETTLED"].includes(round.status) && round.crash_point
            ? ` · ${Number(round.crash_point).toFixed(2)}x`
            : ""}
        </div>
      )}
    </>
  );
}

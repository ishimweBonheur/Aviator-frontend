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
      <ul className="my-5 list-disc pl-[18px] text-xs leading-[1.8] text-[#ac9ab8]">
        <li className="mb-3">
          <strong className="block text-[#e3d6ed]">Connected</strong>{" "}
          Registration, login, wallet balance, place bet, cancellation, cash
          out, funding, history, fairness and realtime events, automatic bets
          and automatic cashouts.
        </li>
        <li className="mb-3">
          <strong className="block text-[#e3d6ed]">Still needed</strong> Real
          external payment provider integration.
        </li>
        <li className="mb-3">
          <strong className="block text-[#e3d6ed]">Persistent history</strong>{" "}
          Recent completed rounds and your account bets. No fabricated player
          totals are shown in backend mode.
        </li>
      </ul>
      <form
        className="grid gap-[17px]"
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
        <label className="grid gap-[7px] text-xs text-[#bfaec9]">
          Look up round ID
          <input
            className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
            name="round"
            type="number"
            min="1"
            step="1"
            required
            disabled={busy}
          />
        </label>
        <button
          className="mt-[13px] flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#4c3a53] bg-[#28202f] p-3 text-xs"
          disabled={busy}
        >
          {busy ? "Looking up…" : "Look up round"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-[#ff8a9f]! wrap-anywhere">
          {error}
        </p>
      )}
      {round && (
        <div className="mt-5 flex items-start gap-2.5 rounded-[7px] bg-[#2a242f] p-[15px] text-[11px] leading-[1.7] text-[#a292af]">
          Round #{round.round_number} · {round.status}
          {["CRASHED", "SETTLED"].includes(round.status) && round.crash_point
            ? ` · ${Number(round.crash_point).toFixed(2)}x`
            : ""}
        </div>
      )}
    </>
  );
}

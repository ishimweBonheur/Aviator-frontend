import { useEffect, useState } from "react";
import { gameApi as api } from "../services/game.api";
import type { ApiRound } from "@/features/game/types/game-api.types";
export function FairnessView() {
  const [rounds, setRounds] = useState<ApiRound[]>([]),
    [round, setRound] = useState<ApiRound>(),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    api
      .rounds()
      .then((r) => {
        if (active) setRounds(r);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const lookup = async (id: number) => {
    setMessage("");
    try {
      setRound(await api.fairness(id));
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <section>
      <p>
        Inspect a round's commitment before play or verify its revealed seed
        after settlement.
      </p>
      <form
        className="grid gap-[17px]"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(Number(new FormData(e.currentTarget).get("id")));
        }}
      >
        <label className="grid gap-[7px] text-xs text-[#bfaec9]">
          Round ID
          <input
            className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
            name="id"
            type="number"
            min="1"
            required
          />
        </label>
        <button className="mt-[13px] flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#4c3a53] bg-[#28202f] p-3 text-xs">
          Inspect fairness
        </button>
      </form>
      <div className="mt-[22px] grid grid-cols-3 gap-[9px]">
        {rounds.map((r) => (
          <button
            className="rounded-[5px] bg-[#202737] px-[9px] py-[5px] text-[10px] font-semibold whitespace-nowrap tabular-nums"
            key={r.id}
            onClick={() => void lookup(r.id)}
          >
            #{r.round_number} · {Number(r.crash_point).toFixed(2)}x
          </button>
        ))}
      </div>
      {round && (
        <div className="mt-4 wrap-anywhere">
          <strong>
            Round #{round.round_number} · {round.status}
          </strong>
          <p>
            Seed hash: <code className="text-xs">{round.server_seed_hash}</code>
          </p>
          <p>
            Client seed: <code className="text-xs">{round.client_seed}</code>
          </p>
          <p>Nonce: {round.nonce}</p>
          <p>
            Server seed:{" "}
            <code className="text-xs">
              {round.server_seed ?? "Hidden until settlement"}
            </code>
          </p>
          {round.crash_point && <p>Crash point: {round.crash_point}x</p>}
          {round.house_edge && <p>House edge: {round.house_edge}</p>}
          {round.server_seed && (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-brand-btn p-3.5 font-semibold"
              onClick={async () => {
                try {
                  const result = await api.verify(round.id);
                  setMessage(result.message);
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              Verify seed and result
            </button>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

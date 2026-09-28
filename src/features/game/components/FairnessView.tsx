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
        className="account-form"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(Number(new FormData(e.currentTarget).get("id")));
        }}
      >
        <label>
          Round ID
          <input name="id" type="number" min="1" required />
        </label>
        <button className="secondary-button">Inspect fairness</button>
      </form>
      <div className="history-grid">
        {rounds.map((r) => (
          <button
            className="history-chip"
            key={r.id}
            onClick={() => void lookup(r.id)}
          >
            #{r.round_number} · {Number(r.crash_point).toFixed(2)}x
          </button>
        ))}
      </div>
      {round && (
        <div className="fairness-details">
          <strong>
            Round #{round.round_number} · {round.status}
          </strong>
          <p>
            Seed hash: <code>{round.server_seed_hash}</code>
          </p>
          <p>
            Client seed: <code>{round.client_seed}</code>
          </p>
          <p>Nonce: {round.nonce}</p>
          <p>
            Server seed:{" "}
            <code>{round.server_seed ?? "Hidden until settlement"}</code>
          </p>
          {round.crash_point && <p>Crash point: {round.crash_point}x</p>}
          {round.house_edge && <p>House edge: {round.house_edge}</p>}
          {round.server_seed && (
            <button
              className="primary-button"
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

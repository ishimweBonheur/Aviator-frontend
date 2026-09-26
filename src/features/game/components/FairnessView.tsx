import { useEffect, useState } from "react";
import { api } from "@/services/backendApi";
import type { ApiRound } from "@/types/api.types";
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
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
                  const encoder = new TextEncoder();
                  const hash = hex(
                    await crypto.subtle.digest(
                      "SHA-256",
                      encoder.encode(round.server_seed!),
                    ),
                  );
                  if (hash !== round.server_seed_hash) {
                    setMessage("Seed hash does not match.");
                    return;
                  }
                  if (round.house_edge === undefined) {
                    setMessage(
                      "Seed hash verified. This legacy round has no recorded house edge for result verification.",
                    );
                    return;
                  }
                  const key = await crypto.subtle.importKey(
                    "raw",
                    encoder.encode(round.server_seed!),
                    { name: "HMAC", hash: "SHA-256" },
                    false,
                    ["sign"],
                  );
                  const digest = hex(
                    await crypto.subtle.sign(
                      "HMAC",
                      key,
                      encoder.encode(round.client_seed + ":" + round.nonce),
                    ),
                  );
                  const random =
                    BigInt("0x" + digest.slice(0, 14)) & ((1n << 52n) - 1n);
                  const expected = Math.max(
                    1,
                    ((1 - Number(round.house_edge)) * 2 ** 52) /
                      (2 ** 52 - Number(random)),
                  );
                  setMessage(
                    Math.abs(
                      Number(expected.toFixed(4)) - Number(round.crash_point),
                    ) < 0.00011
                      ? "Seed commitment and crash result verified."
                      : "Seed verified, but crash result differs.",
                  );
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

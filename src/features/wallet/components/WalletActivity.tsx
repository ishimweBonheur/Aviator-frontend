import { useEffect, useState } from "react";
import { walletApi } from "../services/wallet.api";
import type {
  WalletEntry as Entry,
  WalletResource,
} from "../types/wallet.types";
export function WalletActivity() {
  const [kind, setKind] = useState<WalletResource>("deposits"),
    [provider, setProvider] = useState("SANDBOX"),
    [amount, setAmount] = useState("1000.00");
  const [rows, setRows] = useState<Entry[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    walletApi
      .activity(kind)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [kind]);
  return (
    <section>
      <div className="segmented">
        {(["deposits", "withdrawals", "transactions"] as const).map((k) => (
          <button
            key={k}
            disabled={busy}
            className={kind === k ? "selected" : ""}
            onClick={() => {
              setKind(k);
              setMessage("");
            }}
          >
            {k}
          </button>
        ))}
      </div>
      {kind !== "transactions" && (
        <form
          className="account-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            try {
              const result = await walletApi.submit(
                kind as Exclude<WalletResource, "transactions">,
                { amount, provider },
              );
              const entry = "withdrawal" in result ? result.withdrawal : result;
              setMessage(
                kind === "deposits"
                  ? "Deposit: " + entry.status
                  : "Withdrawal reserved: " + entry.status,
              );
              setRows(await walletApi.activity(kind));
            } catch (error) {
              setMessage((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Amount (RWF)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label>
            Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={busy}
            >
              <option>SANDBOX</option>
              <option>MTN_MOMO</option>
            </select>
          </label>
          <p className="modal-note">
            SANDBOX deposits credit your local test wallet. MTN MoMo payments
            and all withdrawals remain pending; no external provider is
            connected.
          </p>
          <button className="primary-button" disabled={busy}>
            {busy
              ? "Processing…"
              : kind === "deposits"
                ? "Deposit"
                : "Request withdrawal"}
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
      <div className="account-history">
        {rows.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          rows.map((row) => (
            <div className="history-entry" key={row.id}>
              <strong>
                {row.amount} RWF · {row.status ?? row.type}
              </strong>
              <small>
                {row.provider} · {new Date(row.created_at).toLocaleString()}
              </small>
              <small>{row.provider_reference ?? row.reference}</small>
              {row.balance_after && <small>Balance: {row.balance_after}</small>}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

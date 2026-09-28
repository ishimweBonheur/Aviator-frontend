import { WalletNavigation } from "./WalletNavigation";
import { useEffect, useState } from "react";
import { walletApi } from "../services/wallet.api";
import type { WalletEntry as Entry } from "../types/wallet.types";
export function WalletActivity({
  kind = "deposits",
  navigation = true,
}: {
  kind?: "deposits" | "withdrawals";
  navigation?: boolean;
}) {
  const [provider, setProvider] = useState("SANDBOX"),
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
      {navigation && <WalletNavigation active={kind} />}
      <form
        className="grid gap-[17px]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage("");
          try {
            const result = await walletApi.submit(kind, { amount, provider });
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
        <label className="grid gap-[7px] text-xs text-[#bfaec9]">
          Amount (RWF)
          <input
            className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
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
        <label className="grid gap-[7px] text-xs text-[#bfaec9]">
          Provider
          <select
            className="rounded-lg border border-[#444] bg-[#20212b] p-2.5 text-white"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={busy}
          >
            <option>SANDBOX</option>
            <option>MTN_MOMO</option>
          </select>
        </label>
        <p className="mt-4 text-center! text-[10px]! text-[#81708e]!">
          SANDBOX deposits credit your local test wallet. MTN MoMo payments and
          all withdrawals remain pending; no external provider is connected.
        </p>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-brand-btn p-3.5 font-semibold"
          disabled={busy}
        >
          {busy
            ? "Processing…"
            : kind === "deposits"
              ? "Deposit"
              : "Request withdrawal"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      <div className="mt-4 max-h-[240px] overflow-auto">
        {rows.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          rows.map((row) => (
            <div
              className="grid gap-1 border-b border-[#ffffff18] py-3"
              key={row.id}
            >
              <strong>
                {row.amount} RWF · {row.status ?? row.type}
              </strong>
              <small className="text-[#aaa] wrap-anywhere">
                {row.provider} · {new Date(row.created_at).toLocaleString()}
              </small>
              <small className="text-[#aaa] wrap-anywhere">
                {row.provider_reference ?? row.reference}
              </small>
              {row.balance_after && (
                <small className="text-[#aaa] wrap-anywhere">
                  Balance: {row.balance_after}
                </small>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

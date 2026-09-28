import { useEffect, useState } from "react";
import { walletApi } from "../services/wallet.api";
import type { WalletEntry } from "../types/wallet.types";
import { currency } from "@/utils/format";

export function WalletTransactions() {
  const [rows, setRows] = useState<WalletEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState({
    type: "",
    reference: "",
    from: "",
    to: "",
  });
  useEffect(() => {
    let active = true;
    walletApi
      .activity("transactions")
      .then((data) => {
        if (active) {
          setRows(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);
  const visible = rows.filter(
    (row) =>
      (!filter.type || row.type === filter.type) &&
      (!filter.reference ||
        (row.reference ?? "")
          .toLowerCase()
          .includes(filter.reference.toLowerCase())) &&
      (!filter.from || Date.parse(row.created_at) >= Date.parse(filter.from)) &&
      (!filter.to || Date.parse(row.created_at) < Date.parse(filter.to)),
  );
  const inputClass = "rounded-md border border-[#3b3d49] bg-[#111219] p-2.5";
  return (
    <section>
      <p className="my-3 text-xs text-[#999cac]">
        Your latest 200 wallet transactions from the backend. Filters apply to
        these loaded records. Amounts are in RWF.
      </p>
      <form
        className="my-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const next = {
            type: String(data.get("type")),
            reference: String(data.get("reference")).trim(),
            from: String(data.get("from")),
            to: String(data.get("to")),
          };
          if (next.from && next.to && next.from >= next.to) {
            setError("From must be before To.");
            return;
          }
          setError("");
          setFilter(next);
        }}
      >
        <label className="grid gap-2 text-xs">
          Type
          <select className={inputClass} name="type" aria-label="Type">
            <option value="">All types</option>
            {[
              "DEPOSIT",
              "WITHDRAWAL",
              "BET",
              "WIN",
              "REFUND",
              "ADJUSTMENT",
            ].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-xs">
          Reference
          <input className={inputClass} name="reference" />
        </label>
        <label className="grid gap-2 text-xs">
          From
          <input className={inputClass} type="datetime-local" name="from" />
        </label>
        <label className="grid gap-2 text-xs">
          To (exclusive)
          <input className={inputClass} type="datetime-local" name="to" />
        </label>
        <button className="rounded-md bg-[#292830] px-3 py-2.5">
          Apply filters
        </button>
        <button
          type="reset"
          className="rounded-md bg-[#292830] px-3 py-2.5"
          onClick={() => {
            setFilter({ type: "", reference: "", from: "", to: "" });
            setError("");
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className="rounded-md bg-[#292830] px-3 py-2.5"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setVersion((v) => v + 1);
          }}
        >
          Refresh
        </button>
      </form>
      {error && (
        <p role="alert" className="my-3 text-admin-link">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading transactions…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                {[
                  "ID",
                  "Type",
                  "Amount (RWF)",
                  "Reference",
                  "Balance before",
                  "Balance after",
                  "Time",
                ].map((name) => (
                  <th
                    className="border-b border-[#393b47] p-3"
                    scope="col"
                    key={name}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  {[
                    row.id,
                    row.type,
                    currency(Number(row.amount)),
                    row.reference,
                    row.balance_before,
                    row.balance_after,
                  ].map((value, index) => (
                    <td
                      className="max-w-64 border-b border-[#393b47] p-3 wrap-anywhere"
                      key={index}
                    >
                      {value ?? "—"}
                    </td>
                  ))}
                  <td className="border-b border-[#393b47] p-3">
                    <time dateTime={row.created_at}>
                      {new Date(row.created_at).toLocaleString()}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="p-4">No transactions match these filters.</p>
          )}
        </div>
      )}
    </section>
  );
}

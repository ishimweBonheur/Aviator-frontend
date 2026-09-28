import { isAuthorizationError } from "@/services/api";
import { AdminAccessContext } from "../shared/admin-access.context";
import { useContext, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { adminRequest, type Row } from "../shared/admin.api";
import { display, label } from "../shared/display";
export function AdminAction({
  userId,
  kind,
  onClose,
  onSaved,
}: {
  userId: string;
  kind: "status" | "wallet";
  onClose: () => void;
  onSaved: () => void;
}) {
  const onDenied = useContext(AdminAccessContext);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Row>();
  const [reference] = useState(() => crypto.randomUUID());
  return (
    <Modal
      modal={kind}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h2 id="modal-title">
        {kind === "wallet" ? "Wallet adjustment" : "Change account status"} ·
        User #{userId}
      </h2>
      {confirmed ? (
        <div className="grid gap-[17px]">
          <p>Confirm this operation:</p>
          {Object.entries(confirmed)
            .filter(([key]) => key !== "reference")
            .map(([key, value]) => (
              <p key={key}>
                <strong>{label(key)}:</strong> {display(value)}
              </p>
            ))}
          <p>This action is recorded in the administrator audit log.</p>
          {error && (
            <p role="alert" className="text-[#ff8a9f]! wrap-anywhere">
              {error}
            </p>
          )}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-brand-btn p-3.5 font-semibold"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await adminRequest(
                  `users/${userId}/${kind === "wallet" ? "wallet-adjustments" : "status"}`,
                  confirmed,
                  kind === "wallet" ? "POST" : "PATCH",
                );
                onSaved();
              } catch (err) {
                setError((err as Error).message);
                if (isAuthorizationError(err)) onDenied(err as Error);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Confirm action"}
          </button>
          <button
            className="mt-[13px] flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#4c3a53] bg-[#28202f] p-3 text-xs"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      ) : (
        <form
          className="grid gap-[17px]"
          onSubmit={(e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            setConfirmed(kind === "wallet" ? { ...values, reference } : values);
          }}
        >
          {kind === "wallet" ? (
            <>
              <label className="grid gap-[7px] text-xs text-[#bfaec9]">
                Direction
                <select
                  className="min-w-0 max-w-full rounded-md border border-[#3b3d49] bg-[#111219] p-2.5 text-[#eeeef4] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand"
                  name="direction"
                  aria-label="Direction"
                >
                  <option>CREDIT</option>
                  <option>DEBIT</option>
                </select>
              </label>
              <label className="grid gap-[7px] text-xs text-[#bfaec9]">
                Amount (RWF)
                <input
                  className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
                  name="amount"
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  required
                />
              </label>
            </>
          ) : (
            <label className="grid gap-[7px] text-xs text-[#bfaec9]">
              Status
              <select
                className="min-w-0 max-w-full rounded-md border border-[#3b3d49] bg-[#111219] p-2.5 text-[#eeeef4] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand"
                name="status"
                aria-label="Status"
              >
                <option>ACTIVE</option>
                <option>SUSPENDED</option>
                <option>BLOCKED</option>
              </select>
            </label>
          )}
          <label className="grid gap-[7px] text-xs text-[#bfaec9]">
            Reason
            <input
              className="w-full rounded-[7px] border border-[#44354c] bg-[#121117] p-3 text-[#f1ebf4]"
              name="reason"
              minLength={3}
              maxLength={500}
              required
            />
          </label>
          <button className="flex w-full items-center justify-center gap-2 rounded-[7px] bg-brand-btn p-3.5 font-semibold">
            Review action
          </button>
        </form>
      )}
    </Modal>
  );
}

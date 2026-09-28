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
        <div className="account-form">
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
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button
            className="primary-button"
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
            className="secondary-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      ) : (
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            setConfirmed(kind === "wallet" ? { ...values, reference } : values);
          }}
        >
          {kind === "wallet" ? (
            <>
              <label>
                Direction
                <select name="direction" aria-label="Direction">
                  <option>CREDIT</option>
                  <option>DEBIT</option>
                </select>
              </label>
              <label>
                Amount (RWF)
                <input
                  name="amount"
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  required
                />
              </label>
            </>
          ) : (
            <label>
              Status
              <select name="status" aria-label="Status">
                <option>ACTIVE</option>
                <option>SUSPENDED</option>
                <option>BLOCKED</option>
              </select>
            </label>
          )}
          <label>
            Reason
            <input name="reason" minLength={3} maxLength={500} required />
          </label>
          <button className="primary-button">Review action</button>
        </form>
      )}
    </Modal>
  );
}

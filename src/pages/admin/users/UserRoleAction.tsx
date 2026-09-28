import { useContext, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/features/auth/hooks/useSession";
import { isAuthorizationError } from "@/services/api";
import { AdminAccessContext } from "../shared/admin-access.context";
import { adminRequest, type Row } from "../shared/admin.api";

export function UserRoleAction({
  user,
  onSaved,
}: {
  user: Row;
  onSaved: () => void;
}) {
  const auth = useSession();
  const onDenied = useContext(AdminAccessContext);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const role = user.role === "ADMIN" ? "PLAYER" : "ADMIN";
  return (
    <>
      <button
        className="rounded-lg border border-[#393b47] bg-[#2c2e39] px-3.75 py-2.5 disabled:opacity-50"
        disabled={String(user.id) === String(auth.user?.id)}
        title={
          String(user.id) === String(auth.user?.id)
            ? "You cannot change your own role"
            : undefined
        }
        onClick={() => {
          setError("");
          setConfirm(true);
        }}
      >
        {role === "ADMIN"
          ? "Grant admin privileges"
          : "Remove admin privileges"}
      </button>
      {confirm && (
        <Modal
          modal="role-change"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <h2 id="modal-title" className="mb-4 text-xl">
            Confirm role change
          </h2>
          <p className="wrap-anywhere">
            Account: <strong>{String(user.username)}</strong> · User ID{" "}
            {String(user.id)} · {String(user.email)}
          </p>
          <p className="my-4">
            Change {String(user.role)} to {role}? This change is recorded in the
            audit log.
          </p>
          {error && (
            <p role="alert" className="my-3 text-admin-link">
              {error}
            </p>
          )}
          <button
            className="w-full rounded-lg bg-brand-btn p-3 font-semibold"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await adminRequest(`users/${user.id}/role`, { role }, "PATCH");
                setConfirm(false);
                onSaved();
              } catch (err) {
                setError((err as Error).message);
                if (isAuthorizationError(err)) onDenied(err as Error);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Confirm role change"}
          </button>
          <button
            className="mt-3 w-full rounded-lg border border-[#393b47] p-3"
            disabled={busy}
            onClick={() => setConfirm(false)}
          >
            Cancel
          </button>
        </Modal>
      )}
    </>
  );
}

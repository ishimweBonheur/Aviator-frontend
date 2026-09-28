import { useContext, useState } from "react";
import { ShieldCheck, ShieldMinus, UserRoundPlus } from "lucide-react";
import { isAuthorizationError } from "@/services/api";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/features/auth/hooks/useSession";
import { AdminAccessContext } from "../shared/admin-access.context";
import { adminRequest, type Row } from "../shared/admin.api";
import { statusFilter } from "../shared/filter.types";
import { RecordList } from "../shared/RecordList";
export function UsersPage() {
  const auth = useSession();
  const onDenied = useContext(AdminAccessContext);
  const [createAdminRefresh, setCreateAdminRefresh] = useState<
    (() => void) | undefined
  >();
  const [roleAction, setRoleAction] = useState<{
    row: Row;
    role: "PLAYER" | "ADMIN";
    refresh: () => void;
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const changeRole = async () => {
    if (!roleAction) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest(
        `users/${roleAction.row.id}/role`,
        { role: roleAction.role },
        "PATCH",
      );
      roleAction.refresh();
      setRoleAction(undefined);
    } catch (err) {
      setError((err as Error).message);
      if (isAuthorizationError(err)) onDenied(err as Error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <RecordList
        filters={[
          { name: "search", label: "Search", placeholder: "Username or email" },
          statusFilter(["ACTIVE", "SUSPENDED", "BLOCKED"]),
        ]}
        resource="users"
        headerActions={(refresh) => (
          <button onClick={() => setCreateAdminRefresh(() => refresh)}>
            <UserRoundPlus size={16} /> Create administrator
          </button>
        )}
        rowActions={(row, refresh) => {
          const isCurrentUser = String(row.id) === String(auth.user?.id);
          const role = row.role === "ADMIN" ? "PLAYER" : "ADMIN";
          return (
            <button
              disabled={isCurrentUser}
              title={isCurrentUser ? "You cannot change your own role" : undefined}
              onClick={() => {
                setError("");
                setRoleAction({ row, role, refresh });
              }}
            >
              {role === "ADMIN" ? (
                <ShieldCheck size={15} />
              ) : (
                <ShieldMinus size={15} />
              )}
              Make {role.toLowerCase()}
            </button>
          );
        }}
      />
      {roleAction && (
        <Modal
          modal="role-change"
          onClose={() => {
            if (!busy) setRoleAction(undefined);
          }}
        >
          <h2 id="modal-title">Change user role</h2>
          <div className="account-form">
            <p>
              Change {String(roleAction.row.username)} from {String(roleAction.row.role)} to {roleAction.role}?
            </p>
            <p>This action is recorded in the administrator audit log.</p>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button className="primary-button" disabled={busy} onClick={() => void changeRole()}>
              {busy ? "Saving…" : "Confirm role change"}
            </button>
            <button className="secondary-button" disabled={busy} onClick={() => setRoleAction(undefined)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {createAdminRefresh && (
        <CreateAdminModal
          onClose={() => setCreateAdminRefresh(undefined)}
          onSaved={() => {
            createAdminRefresh();
            setCreateAdminRefresh(undefined);
          }}
          onDenied={onDenied}
        />
      )}
    </>
  );
}

function CreateAdminModal({
  onClose,
  onSaved,
  onDenied,
}: {
  onClose: () => void;
  onSaved: () => void;
  onDenied: (error: Error) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal modal="create-admin" onClose={() => !busy && onClose()}>
      <h2 id="modal-title">Create administrator</h2>
      <form
        className="account-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = Object.fromEntries(new FormData(form));
          setBusy(true);
          setError("");
          try {
            await adminRequest("users/admins", values, "POST");
            onSaved();
          } catch (err) {
            setError((err as Error).message);
            if (isAuthorizationError(err)) onDenied(err as Error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Username
          <input name="username" maxLength={50} autoComplete="username" required />
        </label>
        <label>
          Email
          <input name="email" type="email" maxLength={255} autoComplete="email" required />
        </label>
        <label>
          Temporary password
          <input name="password" type="password" minLength={8} maxLength={72} autoComplete="new-password" required />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="primary-button" disabled={busy}>
          {busy ? "Creating…" : "Create admin account"}
        </button>
        <button type="button" className="secondary-button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
      </form>
    </Modal>
  );
}

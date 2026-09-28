import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { isAuthorizationError } from "@/services/api";
import { session } from "@/features/auth/services/session";
import { useSession } from "@/features/auth/hooks/useSession";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { adminRequest } from "./shared/admin.api";
import { ErrorNotice } from "./shared/ErrorNotice";
import { AdminAccessContext } from "./shared/admin-access.context";
import { AdminLayout } from "@/layouts/AdminLayout";
import "./admin.css";
export function AdminGate({
  children,
  section,
  id,
}: {
  children: ReactNode;
  section: string;
  id?: string;
}) {
  const auth = useSession();
  const [access, setAccess] = useState<{
    revision: number;
    allowed: boolean;
    error?: Error;
  }>();
  const [attempt, setAttempt] = useState(0);
  const accessGeneration = useRef(0);
  const onDenied = useCallback(
    (error: Error) => {
      accessGeneration.current += 1;
      setAccess({ revision: auth.revision, allowed: false, error });
    },
    [auth.revision],
  );
  useEffect(() => {
    if (!auth.user) return;
    let active = true;
    const generation = accessGeneration.current;
    adminRequest("session")
      .then(() => {
        if (active && generation === accessGeneration.current)
          setAccess({ revision: auth.revision, allowed: true });
      })
      .catch((error: Error) => {
        if (active)
          setAccess({ revision: auth.revision, allowed: false, error });
      });
    return () => {
      active = false;
    };
  }, [auth.user, auth.revision, attempt]);
  if (!auth.user)
    return (
      <div className="admin-gate admin-card">
        <h1>Admin sign in</h1>
        <AuthForm admin />
        <a href="/">Return to game</a>
      </div>
    );
  if (!access || access.revision !== auth.revision)
    return (
      <p className="admin-empty" role="status">
        Checking administrator access…
      </p>
    );
  if (!access.allowed) {
    const forbidden =
      isAuthorizationError(access.error) && access.error.status === 403;
    return (
      <div className="admin-gate admin-card">
        <h1>Admin access unavailable</h1>
        {forbidden && (
          <p>
            You are signed in as <strong>{auth.user.email}</strong>, but the
            backend has not authorized this account as an active administrator.
            Being signed in does not grant admin access. A database operator
            must verify that this account has the ADMIN role and ACTIVE status.
          </p>
        )}
        <ErrorNotice
          message={access.error?.message ?? "Administrator access required."}
          retry={() => {
            setAccess(undefined);
            setAttempt((n) => n + 1);
          }}
        />
        <button onClick={session.logout}>
          {forbidden ? "Sign in with another account" : "Sign out"}
        </button>
        <a href="/">Return to game</a>
      </div>
    );
  }
  return (
    <AdminAccessContext.Provider value={onDenied}>
      <AdminLayout section={section} id={id} username={auth.user.username}>
        {children}
      </AdminLayout>
    </AdminAccessContext.Provider>
  );
}

import { useState } from "react";
import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import { Table } from "../shared/Table";
import { label } from "../shared/display";
import type { Row } from "../shared/admin.api";
import { AdminAction } from "./AdminAction";
export function UserDetailPage({ id }: { id: string }) {
  const state = useAdminData("users/" + id);
  const data = state.data;
  const [action, setAction] = useState<"status" | "wallet">();
  return (
    <>
      <PageFrame state={state}>
        {data && (
          <>
            {" "}
            <section className="admin-card">
              <h2>Account</h2>
              <Metrics data={data.user as Row} />
              <div className="admin-actions">
                <button onClick={() => setAction("status")}>
                  Change account status
                </button>
                <button onClick={() => setAction("wallet")}>
                  Adjust wallet
                </button>
              </div>
            </section>
            {["bets", "deposits", "withdrawals", "wallet-transactions"].map(
              (resource) => (
                <section className="admin-card" key={resource}>
                  <h2>Recent {label(resource)}</h2>
                  <Table rows={data[resource] as Row[]} />
                </section>
              ),
            )}
          </>
        )}
      </PageFrame>
      {action && (
        <AdminAction
          userId={id}
          kind={action}
          onClose={() => setAction(undefined)}
          onSaved={() => {
            setAction(undefined);
            state.refresh();
          }}
        />
      )}
    </>
  );
}

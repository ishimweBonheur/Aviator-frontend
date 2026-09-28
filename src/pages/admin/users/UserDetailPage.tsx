import { useState } from "react";
import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import { Table } from "../shared/Table";
import { label } from "../shared/display";
import type { Row } from "../shared/admin.api";
import { AdminAction } from "./AdminAction";
import { UserRoleAction } from "./UserRoleAction";
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
            <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
              <h2 className="mb-[18px] text-[15px]">Account</h2>
              <Metrics data={data.user as Row} />
              <div className="flex flex-wrap gap-3">
                <UserRoleAction
                  user={data.user as Row}
                  onSaved={state.refresh}
                />
                <button
                  className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
                  onClick={() => setAction("status")}
                >
                  Change account status
                </button>
                <button
                  className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
                  onClick={() => setAction("wallet")}
                >
                  Adjust wallet
                </button>
              </div>
            </section>
            {["bets", "deposits", "withdrawals", "wallet-transactions"].map(
              (resource) => (
                <section
                  className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5"
                  key={resource}
                >
                  <h2 className="mb-[18px] text-[15px]">
                    Recent {label(resource)}
                  </h2>
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

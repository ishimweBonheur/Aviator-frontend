import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import { Table } from "../shared/Table";
import { LiveRound } from "../system/LiveRound";
import type { Row, Page } from "../shared/admin.api";
export function RoundDetailPage({ id }: { id: string }) {
  const state = useAdminData("rounds/" + id, { live: true, poll: true });
  const data = state.data;
  return (
    <PageFrame state={state} poll>
      {state.current && <LiveRound snapshot={state.current} />}
      {data && (
        <>
          {" "}
          <section className="admin-card">
            <h2>Round and revealed fairness data</h2>
            <Metrics data={data.round as Row} />
            <Metrics data={data.totals as Row} />
            <p className="admin-note">
              Server seeds appear only after settlement. Totals cover resolved
              bets.
            </p>
          </section>
          <section className="admin-card">
            <h2>Bet breakdown (latest 25)</h2>
            <Table rows={(data.bets as Page).items} />
            <a className="admin-link" href="/admin/bets">
              View all bets with a round filter
            </a>
          </section>
        </>
      )}
    </PageFrame>
  );
}

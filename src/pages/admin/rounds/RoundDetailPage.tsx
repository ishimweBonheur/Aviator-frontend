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
          <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
            <h2 className="mb-[18px] text-[15px]">
              Round and revealed fairness data
            </h2>
            <Metrics data={data.round as Row} />
            <Metrics data={data.totals as Row} />
            <p className="my-4 text-xs leading-[1.7] text-[#999cac]">
              Server seeds appear only after settlement. Totals cover resolved
              bets.
            </p>
          </section>
          <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
            <h2 className="mb-[18px] text-[15px]">
              Bet breakdown (latest 25)
            </h2>
            <Table rows={(data.bets as Page).items} />
            <a className="text-admin-link underline" href="/admin/bets">
              View all bets with a round filter
            </a>
          </section>
        </>
      )}
    </PageFrame>
  );
}

import type { Row } from "../shared/admin.api";
import { AdminCharts } from "./AdminCharts";
import { Table } from "../shared/Table";
export function AnalyticsSummary({ daily }: { daily: Row[] }) {
  return (
    <>
      <p className="my-4 text-xs leading-[1.7] text-[#999cac]">
        Realized GGR = settled wagers − payouts. RTP = payouts ÷ wagers × 100.
        Cancelled bets are excluded; deposits are player funds. Daily buckets
        use UTC. Zero wager volume yields 0%.
      </p>
      <AdminCharts daily={daily} />
      <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
        <h2 className="mb-[18px] text-[15px]">Daily totals</h2>
        <Table rows={daily} />
      </section>
    </>
  );
}

import type { Row } from "../shared/admin.api";
import { AdminCharts } from "./AdminCharts";
import { Table } from "../shared/Table";
export function AnalyticsSummary({ daily }: { daily: Row[] }) {
  return (
    <>
      <p className="admin-note">
        Realized GGR = settled wagers − payouts. RTP = payouts ÷ wagers × 100.
        Cancelled bets are excluded; deposits are player funds. Daily buckets
        use UTC. Zero wager volume yields 0%.
      </p>
      <AdminCharts daily={daily} />
      <section className="admin-card">
        <h2>Daily totals</h2>
        <Table rows={daily} />
      </section>
    </>
  );
}

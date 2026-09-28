import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import type { Analytics } from "../shared/admin.api";
import { AnalyticsSummary } from "./AnalyticsSummary";
export function AnalyticsPage() {
  const state = useAdminData("analytics");
  const data = state.data as Analytics | undefined;
  return (
    <PageFrame state={state} filters={[]}>
      <p className="my-4 text-xs leading-relaxed text-[#999cac]">
        Period analysis of settled bets, realized revenue, payouts, payment
        flows and active players. Filter the date range to compare activity over
        time. Round multiplier distributions are not currently supplied by this
        analytics API.
      </p>
      {data && (
        <>
          <Metrics data={data} />
          <AnalyticsSummary daily={data.daily} />
        </>
      )}
    </PageFrame>
  );
}

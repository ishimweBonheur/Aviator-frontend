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
      {data && (
        <>
          <Metrics data={data} />
          <AnalyticsSummary daily={data.daily} />
        </>
      )}
    </PageFrame>
  );
}

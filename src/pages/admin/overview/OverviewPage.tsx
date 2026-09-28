import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import { AnalyticsSummary } from "../analytics/AnalyticsSummary";
import { LiveRound } from "../system/LiveRound";
const overviewKeys = [
  "total_users",
  "active_users",
  "total_player_balances",
  "deposits",
  "withdrawals",
  "total_wagered",
  "total_payouts",
  "ggr",
  "rtp_percent",
  "house_margin_percent",
  "pending_deposits",
  "pending_withdrawals",
  "active_bets",
];

export function OverviewPage() {
  const state = useAdminData("overview", {
    charts: true,
    live: true,
    poll: true,
  });
  return (
    <PageFrame state={state} filters={[]} poll>
      <p className="admin-note">
        All-time overview · monetary values in RWF. Charts use the selected
        period.
      </p>
      {state.data && <Metrics data={state.data} keys={overviewKeys} />}
      {state.current && <LiveRound snapshot={state.current} />}
      {state.analytics && <AnalyticsSummary daily={state.analytics.daily} />}
    </PageFrame>
  );
}

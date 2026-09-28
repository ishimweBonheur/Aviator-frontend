import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import { LiveRound } from "../system/LiveRound";
const overviewKeys = [
  "total_users",
  "active_users",
  "total_player_balances",
  "deposits",
  "withdrawals",
  "total_wagered",
  "total_payouts",
  "total_bets",
  "pending_deposits",
  "pending_withdrawals",
  "active_bets",
];

export function OverviewPage() {
  const state = useAdminData("overview", {
    live: true,
    poll: true,
  });
  return (
    <PageFrame state={state} poll>
      <p className="my-4 text-xs leading-[1.7] text-[#999cac]">
        All-time platform overview · monetary values in RWF.
        <a className="ml-2 text-admin-link underline" href="/admin/analytics">
          View trends and revenue analysis
        </a>
      </p>
      {state.data && <Metrics data={state.data} keys={overviewKeys} />}
      {state.current && <LiveRound snapshot={state.current} />}
    </PageFrame>
  );
}

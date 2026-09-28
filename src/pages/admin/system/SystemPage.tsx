import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import { LiveRound } from "./LiveRound";
export function SystemPage() {
  const state = useAdminData("game/status", { live: true, poll: true });
  return (
    <PageFrame state={state} poll>
      {state.current && <LiveRound snapshot={state.current} />}
      {state.data && <Metrics data={state.data} />}
      <p className="my-4 text-xs leading-[1.7] text-[#999cac]">
        WebSocket count is for the responding backend instance. Leadership
        reports the presence of the Redis engine lease.
      </p>
    </PageFrame>
  );
}

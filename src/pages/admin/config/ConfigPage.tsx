import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import type { Row } from "../shared/admin.api";
export function ConfigPage() {
  const state = useAdminData("config");
  return (
    <PageFrame state={state}>
      <p className="admin-note">
        Read-only server configuration. Changes require updating backend
        environment settings and restarting the service.
      </p>
      {state.data && (
        <>
          <Metrics data={state.data} />
          <section className="admin-card">
            <h2>Risk limits</h2>
            <Metrics data={state.data.limits as Row} />
          </section>
        </>
      )}
    </PageFrame>
  );
}

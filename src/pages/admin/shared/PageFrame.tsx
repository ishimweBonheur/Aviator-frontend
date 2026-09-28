import type { FilterField } from "./filter.types";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { ErrorNotice } from "./ErrorNotice";
import { Filters } from "./Filters";
import type { useAdminData } from "./useAdminData";
export function PageFrame({
  state,
  children,
  filters,
  poll = false,
}: {
  state: ReturnType<typeof useAdminData>;
  children: ReactNode;
  filters?: FilterField[];
  poll?: boolean;
}) {
  return (
    <>
      <div className="admin-toolbar">
        <p>
          {state.updated ? "Last updated " + state.updated : "Loading data…"}
          {poll && " · refreshes every 10s"}
        </p>
        <button disabled={state.loading} onClick={state.refresh}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {filters && (
        <Filters
          fields={filters}
          onApply={state.apply}
          onError={state.setError}
        />
      )}
      {state.error && (
        <ErrorNotice message={state.error} retry={state.refresh} />
      )}
      {state.loading && (
        <p role="status" className="admin-empty">
          Loading…
        </p>
      )}
      {!state.loading && !state.error && state.data && children}
    </>
  );
}

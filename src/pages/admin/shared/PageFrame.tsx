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
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <p className="text-xs leading-[1.7] text-[#999cac]">
          {state.updated ? "Last updated " + state.updated : "Loading data…"}
          {poll && " · refreshes every 10s"}
        </p>
        <button
          className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
          disabled={state.loading}
          onClick={state.refresh}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {filters && (
        <Filters
          key={state.query}
          fields={filters}
          query={state.query}
          onApply={state.apply}
          onError={state.setError}
        />
      )}
      {state.error && (
        <ErrorNotice message={state.error} retry={state.refresh} />
      )}
      {state.loading && (
        <p role="status" className="p-[30px] text-center text-[#a9adbd]">
          Loading…
        </p>
      )}
      {!state.loading && !state.error && state.data && children}
    </>
  );
}

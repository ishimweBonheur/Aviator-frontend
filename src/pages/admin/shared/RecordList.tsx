import type { FilterField } from "./filter.types";
import type { ReactNode } from "react";
import { useAdminData } from "./useAdminData";
import { PageFrame } from "./PageFrame";
import { Table } from "./Table";
import type { Page, Row } from "./admin.api";
import { LiveRound } from "../system/LiveRound";
export function RecordList({
  resource,
  section = resource,
  note,
  live = false,
  filters = [],
  headerActions,
  rowActions,
  columns,
}: {
  resource: string;
  section?: string;
  note?: string;
  live?: boolean;
  filters?: FilterField[];
  headerActions?: (refresh: () => void) => ReactNode;
  rowActions?: (row: Row, refresh: () => void) => ReactNode;
  columns?: string[];
}) {
  const state = useAdminData(resource, { live, poll: live });
  const result = state.data as unknown as Page | undefined;
  return (
    <PageFrame state={state} filters={filters} poll={live}>
      {state.current && <LiveRound snapshot={state.current} />}
      {note && (
        <p className="my-4 text-xs leading-[1.7] text-[#999cac]">{note}</p>
      )}
      {headerActions && (
        <div className="mb-[18px] flex items-center justify-between gap-3">
          {headerActions(state.refresh)}
        </div>
      )}
      {result && (
        <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
          <Table
            rows={result.items}
            resource={section}
            columns={columns}
            actions={rowActions && ((row) => rowActions(row, state.refresh))}
          />
          <div className="flex items-center gap-2.5 pt-[18px] max-[650px]:flex-wrap">
            <span className="mr-auto text-xs text-[#a4a6b4]">
              {result.total} records · Page {state.page}
            </span>
            <button
              className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
              disabled={state.page === 1}
              onClick={() => state.goToPage(state.page - 1)}
            >
              Previous
            </button>
            <button
              className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
              disabled={state.page * (result.page_size || 25) >= result.total}
              onClick={() => state.goToPage(state.page + 1)}
            >
              Next
            </button>
          </div>
        </section>
      )}
    </PageFrame>
  );
}

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
}: {
  resource: string;
  section?: string;
  note?: string;
  live?: boolean;
  filters?: FilterField[];
  headerActions?: (refresh: () => void) => ReactNode;
  rowActions?: (row: Row, refresh: () => void) => ReactNode;
}) {
  const state = useAdminData(resource, { live, poll: live });
  const result = state.data as unknown as Page | undefined;
  return (
    <PageFrame state={state} filters={filters} poll={live}>
      {state.current && <LiveRound snapshot={state.current} />}
      {note && <p className="admin-note">{note}</p>}
      {headerActions && (
        <div className="admin-toolbar">{headerActions(state.refresh)}</div>
      )}
      {result && (
        <section className="admin-card">
          <Table
            rows={result.items}
            resource={section}
            actions={rowActions && ((row) => rowActions(row, state.refresh))}
          />
          <div className="admin-pagination">
            <span>
              {result.total} records · Page {state.page}
            </span>
            <button
              disabled={state.page === 1}
              onClick={() => state.goToPage(state.page - 1)}
            >
              Previous
            </button>
            <button
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

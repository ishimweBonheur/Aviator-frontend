import { betFilters } from "./bet-filters";
import { RecordList } from "../shared/RecordList";
export function AutoCashoutsPage() {
  return (
    <RecordList
      filters={betFilters}
      resource="auto-cashouts"
      note="Persisted server operations. Auto cashouts show the configured target, actual result and execution source; a target does not guarantee a win."
    />
  );
}

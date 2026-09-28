import { betFilters } from "./bet-filters";
import { RecordList } from "../shared/RecordList";
export function AutoBetsPage() {
  return (
    <RecordList
      filters={betFilters}
      resource="auto-bets"
      note="Persisted server operations. Auto cashouts show the configured target, actual result and execution source; a target does not guarantee a win."
    />
  );
}

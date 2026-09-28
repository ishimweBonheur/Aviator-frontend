import { betFilters } from "./bet-filters";
import { RecordList } from "../shared/RecordList";
export function BetsPage() {
  return <RecordList filters={betFilters} resource="bets" />;
}

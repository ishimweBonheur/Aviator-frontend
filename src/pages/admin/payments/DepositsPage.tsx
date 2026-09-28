import { paymentFilters } from "./payment-filters";
import { RecordList } from "../shared/RecordList";
export function DepositsPage() {
  return <RecordList filters={paymentFilters} resource="deposits" />;
}

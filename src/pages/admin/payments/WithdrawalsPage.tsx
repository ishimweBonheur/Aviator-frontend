import { paymentFilters } from "./payment-filters";
import { RecordList } from "../shared/RecordList";
export function WithdrawalsPage() {
  return <RecordList filters={paymentFilters} resource="withdrawals" />;
}

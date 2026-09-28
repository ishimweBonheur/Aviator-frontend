import { userFilter, referenceFilter } from "../shared/filter.types";
import { RecordList } from "../shared/RecordList";
export function TransactionsPage() {
  return (
    <RecordList
      resource="wallet-transactions"
      section="transactions"
      filters={[
        userFilter,
        {
          name: "type",
          label: "Type",
          options: [
            "DEPOSIT",
            "WITHDRAWAL",
            "BET",
            "WIN",
            "REFUND",
            "ADJUSTMENT",
          ],
          emptyLabel: "All types",
        },
        referenceFilter,
      ]}
      note="Wallet ledger in RWF, including each transaction's reference and balance before and after. User ID filters restrict this history to that account."
    />
  );
}

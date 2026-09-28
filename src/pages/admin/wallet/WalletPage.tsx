import { userFilter, referenceFilter } from "../shared/filter.types";
import { RecordList } from "../shared/RecordList";
export function WalletPage() {
  return (
    <RecordList
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
      resource="wallet-transactions"
      section="wallet"
    />
  );
}

import { RecordList } from "../shared/RecordList";
export function WalletPage() {
  return (
    <RecordList
      resource="users"
      section="wallet"
      columns={["username", "id", "balance", "status"]}
      filters={[
        { name: "search", label: "Search", placeholder: "Username or email" },
      ]}
      note="Current account balances in RWF. View History opens transactions for the selected wallet owner."
      rowActions={(row) => (
        <a
          className="text-admin-link underline"
          href={`/admin/transactions?user_id=${row.id}`}
        >
          View History
        </a>
      )}
    />
  );
}

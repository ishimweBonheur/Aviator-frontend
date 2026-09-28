import { statusFilter } from "../shared/filter.types";
import { RecordList } from "../shared/RecordList";
export function UsersPage() {
  return (
    <RecordList
      resource="users"
      filters={[
        { name: "search", label: "Search", placeholder: "Username or email" },
        statusFilter(["ACTIVE", "SUSPENDED", "BLOCKED"]),
      ]}
      rowActions={(row) => (
        <a
          className="text-admin-link underline"
          href={`/admin/users/${row.id}`}
        >
          View Client Details
        </a>
      )}
    />
  );
}

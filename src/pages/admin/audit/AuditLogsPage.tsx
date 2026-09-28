import { userFilter, referenceFilter } from "../shared/filter.types";
import { RecordList } from "../shared/RecordList";
export function AuditLogsPage() {
  return (
    <RecordList
      filters={[
        userFilter,
        { name: "admin_id", label: "Administrator ID", type: "number" },
        {
          name: "action",
          label: "Action",
          options: ["STATUS", "WALLET_ADJUSTMENT", "ROLE_CHANGE", "ADMIN_CREATED"],
          emptyLabel: "All actions",
        },
        referenceFilter,
      ]}
      resource="audit-logs"
      note="Administrator actions recorded by the backend with actor, affected user, reason and reference."
    />
  );
}

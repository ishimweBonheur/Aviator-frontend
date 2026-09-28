import { statusFilter } from "../shared/filter.types";
import { RecordList } from "../shared/RecordList";
export function RoundsPage() {
  return (
    <RecordList
      filters={[
        statusFilter([
          "CREATED",
          "BETTING_OPEN",
          "BETTING_CLOSED",
          "RUNNING",
          "CRASHED",
          "SETTLED",
        ]),
      ]}
      resource="rounds"
      live
    />
  );
}

import {
  userFilter,
  statusFilter,
  type FilterField,
} from "../shared/filter.types";
export const betFilters: FilterField[] = [
  userFilter,
  { name: "round_id", label: "Round ID", type: "number" },
  statusFilter(["ACTIVE", "CASHED_OUT", "LOST", "CANCELLED"]),
];

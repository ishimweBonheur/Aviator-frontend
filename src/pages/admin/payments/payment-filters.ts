import { userFilter, statusFilter } from "../shared/filter.types";
export const paymentFilters = [
  userFilter,
  statusFilter(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]),
];

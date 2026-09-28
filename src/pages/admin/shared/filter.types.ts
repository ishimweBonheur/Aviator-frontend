export interface FilterField {
  name: string;
  label: string;
  type?: "number" | "text";
  placeholder?: string;
  options?: string[];
  emptyLabel?: string;
}
export const userFilter: FilterField = {
  name: "user_id",
  label: "User ID",
  type: "number",
};
export const referenceFilter: FilterField = {
  name: "reference",
  label: "Reference",
};
export const statusFilter = (options: string[]): FilterField => ({
  name: "status",
  label: "Status",
  options,
  emptyLabel: "All statuses",
});

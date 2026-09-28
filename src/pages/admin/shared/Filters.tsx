import type { FilterField } from "./filter.types";
export function Filters({
  fields,
  onApply,
  onError,
}: {
  fields: FilterField[];
  onApply: (query: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <form
      className="admin-filters"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        for (const [key, raw] of new FormData(event.currentTarget)) {
          const value = String(raw).trim();
          if (value)
            params.set(
              key,
              ["from", "to"].includes(key)
                ? new Date(value).toISOString()
                : value,
            );
        }
        const from = params.get("from"),
          to = params.get("to");
        if (from && to && from >= to) {
          onError("From must be before To.");
          return;
        }
        onApply(params.toString());
      }}
    >
      {fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.options ? (
            <select name={field.name} aria-label={field.label}>
              <option value="">{field.emptyLabel ?? "All"}</option>
              {field.options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              min={field.type === "number" ? 1 : undefined}
              step={field.type === "number" ? 1 : undefined}
            />
          )}
        </label>
      ))}
      <label>
        From
        <input type="datetime-local" name="from" />
      </label>
      <label>
        To (exclusive)
        <input type="datetime-local" name="to" />
      </label>
      <button type="submit">Apply filters</button>
      <button type="reset" onClick={() => onApply("")}>
        Reset
      </button>
    </form>
  );
}

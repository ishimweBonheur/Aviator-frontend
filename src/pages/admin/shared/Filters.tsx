import type { FilterField } from "./filter.types";
function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function Filters({
  fields,
  onApply,
  onError,
  query = "",
}: {
  fields: FilterField[];
  onApply: (query: string) => void;
  onError: (message: string) => void;
  query?: string;
}) {
  const fieldClass =
    "max-w-full min-w-0 rounded-md border border-[#3b3d49] bg-[#111219] p-2.5 text-[#eeeef4] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand";
  return (
    <form
      className="mb-5 flex flex-wrap items-end gap-3 rounded-[10px] border border-[#2c2e39] bg-[#191a22] p-4"
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
        <label
          className="grid gap-[7px] text-[11px] text-[#b0b2bf] max-[650px]:min-w-[120px] max-[650px]:flex-1"
          key={field.name}
        >
          {field.label}
          {field.options ? (
            <select
              className={fieldClass}
              name={field.name}
              aria-label={field.label}
              defaultValue={new URLSearchParams(query).get(field.name) ?? ""}
            >
              <option value="">{field.emptyLabel ?? "All"}</option>
              {field.options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ) : (
            <input
              className={`${fieldClass} w-[175px] max-[650px]:w-full`}
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              defaultValue={new URLSearchParams(query).get(field.name) ?? ""}
              min={field.type === "number" ? 1 : undefined}
              step={field.type === "number" ? 1 : undefined}
            />
          )}
        </label>
      ))}
      <label className="grid gap-[7px] text-[11px] text-[#b0b2bf] max-[650px]:min-w-[120px] max-[650px]:flex-1">
        From
        <input
          className={`${fieldClass} w-[175px] max-[650px]:w-full`}
          type="datetime-local"
          name="from"
          defaultValue={localDate(new URLSearchParams(query).get("from"))}
        />
      </label>
      <label className="grid gap-[7px] text-[11px] text-[#b0b2bf] max-[650px]:min-w-[120px] max-[650px]:flex-1">
        To (exclusive)
        <input
          className={`${fieldClass} w-[175px] max-[650px]:w-full`}
          type="datetime-local"
          name="to"
          defaultValue={localDate(new URLSearchParams(query).get("to"))}
        />
      </label>
      <button
        className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
        type="submit"
      >
        Apply filters
      </button>
      <button
        className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
        type="reset"
        onClick={() => onApply("")}
      >
        Reset
      </button>
    </form>
  );
}

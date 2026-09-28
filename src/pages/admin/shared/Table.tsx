import type { ReactNode } from "react";
import type { Row } from "./admin.api";
import { display, label } from "./display";

function statusClass(status: string) {
  const base = "inline-block rounded px-2 py-1.25 text-[10px]";
  if (["ACTIVE", "COMPLETED", "CASHED_OUT", "SETTLED"].includes(status))
    return base + " bg-[#52d9ac1a] text-admin-success";
  if (["BLOCKED", "FAILED", "LOST"].includes(status))
    return base + " bg-[#fa416419] text-admin-link";
  return base + " bg-[#3b3d49]";
}
function Cell({
  row,
  name,
  resource,
}: {
  row: Row;
  name: string;
  resource?: string;
}) {
  const value = row[name];
  if (value === null || value === undefined) return <span>?</span>;
  if (name === "details" && typeof value === "object")
    return (
      <dl className="grid min-w-48 max-w-96 gap-2 whitespace-normal wrap-anywhere">
        {Object.entries(value).map(([key, detail]) => (
          <div key={key}>
            <dt className="font-medium text-[#999cad]">{label(key)}</dt>
            <dd>{display(detail)}</dd>
          </div>
        ))}
      </dl>
    );
  if (
    name.endsWith("_at") &&
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  )
    return (
      <time dateTime={value} title={value}>
        {new Date(value).toLocaleString(undefined, { timeZoneName: "short" })}
      </time>
    );
  const userId =
    name === "admin_username" || name === "admin_id"
      ? row.admin_id
      : name === "username"
        ? (row.user_id ?? row.id)
        : name === "user_id"
          ? value
          : undefined;
  if (userId != null)
    return (
      <a className="text-admin-link underline" href={`/admin/users/${userId}`}>
        {display(value)}
      </a>
    );
  if (name === "id" && ["users", "rounds", "wallet"].includes(resource ?? ""))
    return (
      <a
        className="text-admin-link underline"
        href={`/admin/${resource === "wallet" ? "users" : resource}/${value}`}
      >
        {display(value)}
      </a>
    );
  if (name === "status" || name === "role")
    return <span className={statusClass(String(value))}>{display(value)}</span>;
  if (name === "action")
    return (
      <span className="font-medium">{label(String(value).toLowerCase())}</span>
    );
  return <>{display(value)}</>;
}
export function Table({
  rows,
  resource,
  actions,
  columns: selected,
}: {
  rows: Row[];
  resource?: string;
  actions?: (row: Row) => ReactNode;
  columns?: string[];
}) {
  if (!rows.length)
    return (
      <p className="p-7.5 text-center text-[#a9adbd]">
        No records match these filters.
      </p>
    );
  const available = [...new Set(rows.flatMap(Object.keys))];
  const priority =
    resource === "audit-logs"
      ? [
          "created_at",
          "admin_username",
          "admin_id",
          "username",
          "user_id",
          "action",
          "details",
          "reference",
          "id",
        ]
      : ["username", "user_id"];
  const columns = selected ?? [
    ...priority.filter((key) => available.includes(key)),
    ...available.filter((key) => !priority.includes(key)),
  ];
  return (
    <div
      className="max-w-full overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label={label(resource ?? "Records") + " table"}
    >
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            {columns.map((key) => (
              <th
                scope="col"
                className="border-b border-[#2a2c36] px-3.25 py-3.5 text-[10px] font-medium tracking-[0.6px] whitespace-nowrap text-[#999cad] uppercase"
                key={key}
              >
                {resource === "wallet" && key === "id"
                  ? "User ID"
                  : key === "admin_username"
                    ? "Administrator"
                    : label(key)}
              </th>
            ))}
            {actions && (
              <th
                scope="col"
                className="border-b border-[#2a2c36] px-3.25 py-3.5 text-[10px] text-[#999cad] uppercase"
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              className="hover:[&>td]:bg-[#ffffff03]"
              key={String(row.id ?? i)}
            >
              {columns.map((key) => (
                <td
                  className="border-b border-[#2a2c36] px-3.25 py-3.5 align-top"
                  key={key}
                >
                  <div
                    className={
                      key === "details"
                        ? ""
                        : "min-w-20 max-w-64 whitespace-normal wrap-anywhere"
                    }
                  >
                    <Cell row={row} name={key} resource={resource} />
                  </div>
                </td>
              ))}
              {actions && (
                <td className="border-b border-[#2a2c36] px-3.25 py-3.5 align-top">
                  <div className="min-w-32">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

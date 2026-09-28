import type { ReactNode } from "react";
import type { Row } from "./admin.api";
import { display, label } from "./display";
export function Table({
  rows,
  resource,
  actions,
}: {
  rows: Row[];
  resource?: string;
  actions?: (row: Row) => ReactNode;
}) {
  if (!rows.length)
    return <p className="admin-empty">No records match these filters.</p>;
  const columns = Object.keys(rows[0]);
  return (
    <div className="admin-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((key) => (
              <th key={key}>{label(key)}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row.id ?? i)}>
              {columns.map((key) => (
                <td key={key}>
                  {key === "id" &&
                  (resource === "users" || resource === "rounds") ? (
                    <a
                      className="admin-link"
                      href={`/admin/${resource}/${row.id}`}
                    >
                      #{display(row[key])}
                    </a>
                  ) : key === "user_id" ? (
                    <a className="admin-link" href={`/admin/users/${row[key]}`}>
                      #{display(row[key])}
                    </a>
                  ) : key === "status" ? (
                    <span
                      className={`admin-status ${String(row[key]).toLowerCase()}`}
                    >
                      {display(row[key])}
                    </span>
                  ) : (
                    display(row[key])
                  )}
                </td>
              ))}
              {actions && <td>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

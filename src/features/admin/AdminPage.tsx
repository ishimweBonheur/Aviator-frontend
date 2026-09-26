import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/store/app.store";
import { gameService, switchMode } from "@/features/game/services/game.service";
import { BackendAccount } from "@/features/auth/components/BackendAccount";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/services/api";
import { adminRequest, type Analytics, type Page, type Row } from "./admin.api";
import { AdminCharts } from "./AdminCharts";
import "./admin.css";
import { LiveRound } from "./LiveRound";

const sections = [
  "overview",
  "users",
  "bets",
  "rounds",
  "deposits",
  "withdrawals",
  "wallet",
  "analytics",
  "system",
  "config",
];
const label = (key: string) =>
  key
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
function display(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
const overviewKeys = [
  "total_users",
  "active_users",
  "total_player_balances",
  "deposits",
  "withdrawals",
  "total_wagered",
  "total_payouts",
  "ggr",
  "rtp_percent",
  "house_margin_percent",
  "pending_deposits",
  "pending_withdrawals",
  "active_bets",
];
const names: Record<string, string> = {
  total_player_balances: "Player wallet liability",
  deposits: "Completed deposits",
  withdrawals: "Completed withdrawals",
  rtp_percent: "RTP (%)",
  house_margin_percent: "House margin (%)",
  ggr: "GGR",
};
function Metrics({
  data,
  keys = Object.keys(data),
}: {
  data: Row;
  keys?: string[];
}) {
  return (
    <div className="admin-metrics">
      {keys
        .filter(
          (key) => !Array.isArray(data[key]) && typeof data[key] !== "object",
        )
        .map((key) => (
          <article className="admin-card" key={key}>
            <span>{names[key] ?? label(key)}</span>
            <strong>{display(data[key])}</strong>
          </article>
        ))}
    </div>
  );
}
function Table({ rows, resource }: { rows: Row[]; resource?: string }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="admin-error" role="alert">
      <p>{message}</p>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}

export function AdminPage() {
  const { game, backend } = useApp();
  const [access, setAccess] = useState<{
    user: number;
    allowed: boolean;
    error?: string;
  }>();
  const [attempt, setAttempt] = useState(0);
  const parts = window.location.pathname.split("/").filter(Boolean);
  const section = parts[1] ?? "overview";
  const id = parts[2];
  const userId = game.user?.id;
  useEffect(() => {
    if (!backend || !userId) return;
    let active = true;
    const user = userId;
    adminRequest("session")
      .then(() => {
        if (active) setAccess({ user, allowed: true });
      })
      .catch((error: Error) => {
        if (active) setAccess({ user, allowed: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [backend, userId, attempt]);
  if (!backend)
    return (
      <div className="admin-gate admin-card">
        <ShieldCheck />
        <h1>Administration</h1>
        <p>Connect to the backend to sign in.</p>
        <button onClick={() => switchMode("backend")}>Use backend</button>
      </div>
    );
  if (!game.user)
    return (
      <div className="admin-gate admin-card">
        <h1>Admin sign in</h1>
        <BackendAccount game={game} />
        <a href="/">Return to game</a>
      </div>
    );
  if (!access || access.user !== game.user.id)
    return (
      <p className="admin-empty" role="status">
        Checking administrator access…
      </p>
    );
  if (!access.allowed)
    return (
      <div className="admin-gate admin-card">
        <h1>Admin access unavailable</h1>
        <ErrorNotice
          message={access.error ?? "Administrator access required."}
          retry={() => setAttempt((n) => n + 1)}
        />
        <button onClick={() => gameService.logout?.()}>Sign out</button>
        <a href="/">Return to game</a>
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin">
          <ShieldCheck /> altitude<span>ADMIN</span>
        </a>
        <nav aria-label="Administration">
          {sections.map((item) => (
            <a
              aria-current={section === item ? "page" : undefined}
              key={item}
              href={item === "overview" ? "/admin" : `/admin/${item}`}
            >
              <LayoutDashboard size={16} />
              {label(item)}
            </a>
          ))}
        </nav>
        <a href="/">
          <ArrowLeft size={16} /> Back to game
        </a>
      </aside>
      <div className="admin-main">
        <header className="admin-heading">
          <div>
            <small>OPERATIONS / {label(section).toUpperCase()}</small>
            <h1>
              {label(section)}
              {id ? ` #${id}` : ""}
            </h1>
          </div>
          <div>
            <span>{game.user.username}</span>
            <button onClick={() => gameService.logout?.()}>Sign out</button>
          </div>
        </header>
        {sections.includes(section) &&
        (!id || (["users", "rounds"].includes(section) && /^\d+$/.test(id))) ? (
          <AdminContent
            key={`${section}/${id ?? ""}`}
            section={section}
            id={id}
            onDenied={(message) =>
              setAccess({ user: game.user!.id, allowed: false, error: message })
            }
          />
        ) : (
          <p className="admin-empty">
            Page not found. <a href="/admin">Return to overview</a>
          </p>
        )}
      </div>
    </div>
  );
}

function AdminContent({
  section,
  id,
  onDenied,
}: {
  section: string;
  id?: string;
  onDenied: (message: string) => void;
}) {
  const [data, setData] = useState<Row>();
  const [analytics, setAnalytics] = useState<Analytics>();
  const [current, setCurrent] = useState<Row>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [updated, setUpdated] = useState("");
  const [action, setAction] = useState<"status" | "wallet">();
  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  const isList =
    ["users", "bets", "rounds", "deposits", "withdrawals", "wallet"].includes(
      section,
    ) && !id;
  useEffect(() => {
    let active = true;
    const resource =
      section === "wallet"
        ? "wallet-transactions"
        : section === "system"
          ? "game/status"
          : section;
    const search = new URLSearchParams(query);
    search.set("page", String(page));
    const path = `${resource}${id ? `/${id}` : ""}?${search}`;
    const load = async () => {
      try {
        const result = await adminRequest<Row>(path);
        const stats =
          section === "overview"
            ? await adminRequest<Analytics>(`analytics?${query}`)
            : undefined;
        const live = ["overview", "system", "rounds"].includes(section)
          ? await adminRequest<Row>("game/current")
          : undefined;
        if (active) {
          setData(result);
          setAnalytics(stats);
          setCurrent(live);
          setError("");
          setUpdated(new Date().toLocaleTimeString());
        }
      } catch (err) {
        if (active) {
          const e = err as Error;
          setError(e.message);
          if (e instanceof ApiError && [401, 403].includes(e.status))
            onDenied(e.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = ["overview", "system", "rounds"].includes(section)
      ? setInterval(() => void load(), 10000)
      : undefined;
    return () => {
      active = false;
      clearInterval(timer);
    };
    // Access failures are reported to the parent, which unmounts this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, id, query, page, version]);
  const daily =
    section === "analytics"
      ? (data as Analytics | undefined)?.daily
      : analytics?.daily;
  return (
    <>
      <div className="admin-toolbar">
        <p>
          {updated ? `Last updated ${updated}` : "Loading data…"}
          {["overview", "system", "rounds"].includes(section) &&
            " · refreshes every 10s"}
        </p>
        <button
          disabled={loading}
          onClick={() => {
            setLoading(true);
            refresh();
          }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {(isList || ["analytics", "overview"].includes(section)) && (
        <form
          className="admin-filters"
          onSubmit={(e) => {
            e.preventDefault();
            const values = new FormData(e.currentTarget);
            const params = new URLSearchParams();
            for (const [key, raw] of values) {
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
              setError("From must be before To.");
              return;
            }
            setPage(1);
            setQuery(params.toString());
            setLoading(true);
            refresh();
          }}
        >
          {section === "users" && (
            <label>
              Search
              <input name="search" placeholder="Username or email" />
            </label>
          )}
          {isList && !["users", "rounds"].includes(section) && (
            <label>
              User ID
              <input name="user_id" type="number" min="1" step="1" />
            </label>
          )}
          {section === "bets" && (
            <label>
              Round ID
              <input name="round_id" type="number" min="1" step="1" />
            </label>
          )}
          {isList && section !== "wallet" && (
            <label>
              Status
              <select name="status" aria-label="Status">
                <option value="">All statuses</option>
                {(section === "users"
                  ? ["ACTIVE", "SUSPENDED", "BLOCKED"]
                  : section === "bets"
                    ? ["ACTIVE", "CASHED_OUT", "LOST", "CANCELLED"]
                    : section === "rounds"
                      ? [
                          "CREATED",
                          "BETTING_OPEN",
                          "BETTING_CLOSED",
                          "RUNNING",
                          "CRASHED",
                          "SETTLED",
                        ]
                      : [
                          "PENDING",
                          "PROCESSING",
                          "COMPLETED",
                          "FAILED",
                          "CANCELLED",
                        ]
                ).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          {section === "wallet" && (
            <>
              <label>
                Type
                <select name="type" aria-label="Type">
                  <option value="">All types</option>
                  {[
                    "DEPOSIT",
                    "WITHDRAWAL",
                    "BET",
                    "WIN",
                    "REFUND",
                    "ADJUSTMENT",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Reference
                <input name="reference" />
              </label>
            </>
          )}
          <label>
            From
            <input type="datetime-local" name="from" />
          </label>
          <label>
            To (exclusive)
            <input type="datetime-local" name="to" />
          </label>
          <button type="submit">Apply filters</button>
          <button
            type="reset"
            onClick={() => {
              setQuery("");
              setPage(1);
              setLoading(true);
              refresh();
            }}
          >
            Reset
          </button>
        </form>
      )}
      {error && <ErrorNotice message={error} retry={refresh} />}
      {loading && (
        <p role="status" className="admin-empty">
          Loading…
        </p>
      )}
      {!loading && !error && data && (
        <>
          {section === "overview" && (
            <>
              <p className="admin-note">
                All-time overview · monetary values in RWF. Charts use the
                selected period.
              </p>
              <Metrics data={data} keys={overviewKeys} />
            </>
          )}
          {section === "analytics" && <Metrics data={data} />}
          {current && <LiveRound snapshot={current} />}
          {daily && (
            <>
              <p className="admin-note">
                Realized GGR = settled wagers − payouts. RTP = payouts ÷ wagers
                × 100. Cancelled bets are excluded; deposits are player funds.
                Daily buckets use UTC. Zero wager volume yields 0%.
              </p>
              <AdminCharts daily={daily} />
              <section className="admin-card">
                <h2>Daily totals</h2>
                <Table rows={daily} />
              </section>
            </>
          )}
          {isList && (
            <section className="admin-card">
              <Table
                rows={(data as unknown as Page).items}
                resource={section}
              />
              <div className="admin-pagination">
                <span>
                  {(data as unknown as Page).total} records · Page {page}
                </span>
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setPage((n) => n - 1);
                    setLoading(true);
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page * 25 >= (data as unknown as Page).total}
                  onClick={() => {
                    setPage((n) => n + 1);
                    setLoading(true);
                  }}
                >
                  Next
                </button>
              </div>
            </section>
          )}
          {id && section === "users" && (
            <>
              <section className="admin-card">
                <h2>Account</h2>
                <Metrics data={data.user as Row} />
                <div className="admin-actions">
                  <button onClick={() => setAction("status")}>
                    Change account status
                  </button>
                  <button onClick={() => setAction("wallet")}>
                    Adjust wallet
                  </button>
                </div>
              </section>
              {["bets", "deposits", "withdrawals", "wallet-transactions"].map(
                (resource) => (
                  <section className="admin-card" key={resource}>
                    <h2>Recent {label(resource)}</h2>
                    <Table rows={data[resource] as Row[]} />
                  </section>
                ),
              )}
            </>
          )}
          {id && section === "rounds" && (
            <>
              <section className="admin-card">
                <h2>Round and revealed fairness data</h2>
                <Metrics data={data.round as Row} />
                <Metrics data={data.totals as Row} />
                <p className="admin-note">
                  Server seeds appear only after settlement. Totals cover
                  resolved bets.
                </p>
              </section>
              <section className="admin-card">
                <h2>Bet breakdown (latest 25)</h2>
                <Table rows={(data.bets as Page).items} />
                <a className="admin-link" href="/admin/bets">
                  View all bets with a round filter
                </a>
              </section>
            </>
          )}
          {section === "system" && (
            <>
              <Metrics data={data} />
              <p className="admin-note">
                WebSocket count is for the responding backend instance.
                Leadership reports the presence of the Redis engine lease.
              </p>
            </>
          )}
          {section === "config" && (
            <>
              <p className="admin-note">
                Read-only server configuration. Changes require updating backend
                environment settings and restarting the service.
              </p>
              <Metrics data={data} />
              <section className="admin-card">
                <h2>Risk limits</h2>
                <Metrics data={data.limits as Row} />
              </section>
            </>
          )}
        </>
      )}
      {action && id && (
        <AdminAction
          userId={id}
          kind={action}
          onClose={() => setAction(undefined)}
          onSaved={() => {
            setAction(undefined);
            refresh();
          }}
        />
      )}
    </>
  );
}

function AdminAction({
  userId,
  kind,
  onClose,
  onSaved,
}: {
  userId: string;
  kind: "status" | "wallet";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Row>();
  const [reference] = useState(() => crypto.randomUUID());
  return (
    <Modal
      modal={kind}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h2 id="modal-title">
        {kind === "wallet" ? "Wallet adjustment" : "Change account status"} ·
        User #{userId}
      </h2>
      {confirmed ? (
        <div className="account-form">
          <p>Confirm this operation:</p>
          {Object.entries(confirmed)
            .filter(([key]) => key !== "reference")
            .map(([key, value]) => (
              <p key={key}>
                <strong>{label(key)}:</strong> {display(value)}
              </p>
            ))}
          <p>This action is recorded in the administrator audit log.</p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button
            className="primary-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await adminRequest(
                  `users/${userId}/${kind === "wallet" ? "wallet-adjustments" : "status"}`,
                  confirmed,
                  kind === "wallet" ? "POST" : "PATCH",
                );
                onSaved();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Confirm action"}
          </button>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      ) : (
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            setConfirmed(kind === "wallet" ? { ...values, reference } : values);
          }}
        >
          {kind === "wallet" ? (
            <>
              <label>
                Direction
                <select name="direction" aria-label="Direction">
                  <option>CREDIT</option>
                  <option>DEBIT</option>
                </select>
              </label>
              <label>
                Amount (RWF)
                <input
                  name="amount"
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,2})?"
                  required
                />
              </label>
            </>
          ) : (
            <label>
              Status
              <select name="status" aria-label="Status">
                <option>ACTIVE</option>
                <option>SUSPENDED</option>
                <option>BLOCKED</option>
              </select>
            </label>
          )}
          <label>
            Reason
            <input name="reason" minLength={3} maxLength={500} required />
          </label>
          <button className="primary-button">Review action</button>
        </form>
      )}
    </Modal>
  );
}

import { lazy, Suspense } from "react";
const PlayerWalletPage = lazy(() =>
  import("@/pages/Wallet/WalletPage").then((m) => ({ default: m.WalletPage })),
);
const FairnessPage = lazy(() =>
  import("@/pages/Game/FairnessPage").then((m) => ({
    default: m.FairnessPage,
  })),
);
const GamePage = lazy(() =>
  import("@/pages/Game/GamePage").then((m) => ({ default: m.GamePage })),
);
const AdminGate = lazy(() =>
  import("@/pages/admin/AdminGate").then((m) => ({ default: m.AdminGate })),
);
const UsersPage = lazy(() =>
  import("@/pages/admin/users/UsersPage").then((m) => ({
    default: m.UsersPage,
  })),
);
const BetsPage = lazy(() =>
  import("@/pages/admin/bets/BetsPage").then((m) => ({ default: m.BetsPage })),
);
const AutoBetsPage = lazy(() =>
  import("@/pages/admin/bets/AutoBetsPage").then((m) => ({
    default: m.AutoBetsPage,
  })),
);
const AutoCashoutsPage = lazy(() =>
  import("@/pages/admin/bets/AutoCashoutsPage").then((m) => ({
    default: m.AutoCashoutsPage,
  })),
);
const RoundsPage = lazy(() =>
  import("@/pages/admin/rounds/RoundsPage").then((m) => ({
    default: m.RoundsPage,
  })),
);
const DepositsPage = lazy(() =>
  import("@/pages/admin/payments/DepositsPage").then((m) => ({
    default: m.DepositsPage,
  })),
);
const WithdrawalsPage = lazy(() =>
  import("@/pages/admin/payments/WithdrawalsPage").then((m) => ({
    default: m.WithdrawalsPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("@/pages/admin/wallet/TransactionsPage").then((m) => ({
    default: m.TransactionsPage,
  })),
);
const WalletPage = lazy(() =>
  import("@/pages/admin/wallet/WalletPage").then((m) => ({
    default: m.WalletPage,
  })),
);
const AuditLogsPage = lazy(() =>
  import("@/pages/admin/audit/AuditLogsPage").then((m) => ({
    default: m.AuditLogsPage,
  })),
);
const OverviewPage = lazy(() =>
  import("@/pages/admin/overview/OverviewPage").then((m) => ({
    default: m.OverviewPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import("@/pages/admin/analytics/AnalyticsPage").then((m) => ({
    default: m.AnalyticsPage,
  })),
);
const SystemPage = lazy(() =>
  import("@/pages/admin/system/SystemPage").then((m) => ({
    default: m.SystemPage,
  })),
);
const ConfigPage = lazy(() =>
  import("@/pages/admin/config/ConfigPage").then((m) => ({
    default: m.ConfigPage,
  })),
);
const UserDetailPage = lazy(() =>
  import("@/pages/admin/users/UserDetailPage").then((m) => ({
    default: m.UserDetailPage,
  })),
);
const RoundDetailPage = lazy(() =>
  import("@/pages/admin/rounds/RoundDetailPage").then((m) => ({
    default: m.RoundDetailPage,
  })),
);
const adminPages = {
  users: UsersPage,
  bets: BetsPage,
  "auto-bets": AutoBetsPage,
  "auto-cashouts": AutoCashoutsPage,
  rounds: RoundsPage,
  deposits: DepositsPage,
  withdrawals: WithdrawalsPage,
  wallet: WalletPage,
  transactions: TransactionsPage,
  "audit-logs": AuditLogsPage,
  overview: OverviewPage,
  analytics: AnalyticsPage,
  system: SystemPage,
  config: ConfigPage,
};
export function AppRoutes() {
  const pathname = window.location.pathname;
  if (pathname === "/fairness")
    return (
      <Suspense fallback={<p role="status">Loading fairness…</p>}>
        <FairnessPage />
      </Suspense>
    );
  if (
    pathname === "/deposits" ||
    pathname === "/withdrawals" ||
    pathname === "/transactions"
  ) {
    const kind = pathname.slice(1) as
      "deposits" | "withdrawals" | "transactions";
    return (
      <Suspense fallback={<p role="status">Loading wallet…</p>}>
        <PlayerWalletPage kind={kind} />
      </Suspense>
    );
  }
  if (/^\/admin(?:\/|$)/.test(pathname)) {
    const [, section = "overview", id, extra] = pathname
      .split("/")
      .filter(Boolean);
    const Page = adminPages[section as keyof typeof adminPages];
    const content =
      !extra && id && /^\d+$/.test(id) && section === "users" ? (
        <UserDetailPage id={id} />
      ) : !extra && id && /^\d+$/.test(id) && section === "rounds" ? (
        <RoundDetailPage id={id} />
      ) : !id && Page ? (
        <Page />
      ) : (
        <p className="p-[30px] text-center text-[#a9adbd]">
          Page not found. <a href="/admin">Return to overview</a>
        </p>
      );
    return (
      <Suspense fallback={<p role="status">Loading administration…</p>}>
        <AdminGate section={section} id={id}>
          {content}
        </AdminGate>
      </Suspense>
    );
  }
  if (pathname !== "/")
    return (
      <main>
        <h1>Page not found</h1>
        <a href="/">Return to game</a>
      </main>
    );
  return (
    <Suspense fallback={<p role="status">Loading game…</p>}>
      <GamePage />
    </Suspense>
  );
}

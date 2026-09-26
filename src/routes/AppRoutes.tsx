import { lazy, Suspense } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { GamePage } from "@/pages/Game/GamePage";
const AdminPage = lazy(() =>
  import("@/features/admin/AdminPage").then((module) => ({
    default: module.AdminPage,
  })),
);
export function AppRoutes() {
  if (/^\/admin(?:\/|$)/.test(window.location.pathname))
    return (
      <Suspense fallback={<p role="status">Loading administration…</p>}>
        <AdminPage />
      </Suspense>
    );
  return (
    <MainLayout>
      <GamePage />
    </MainLayout>
  );
}

import type { ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, ShieldCheck } from "lucide-react";
import { session } from "@/features/auth/services/session";
import { label } from "@/pages/admin/shared/display";
import { adminSections as sections } from "@/routes/admin-navigation";
export function AdminLayout({
  section,
  id,
  username,
  children,
}: {
  section: string;
  id?: string;
  username: string;
  children: ReactNode;
}) {
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
            <span>{username}</span>
            <button onClick={() => session.logout()}>Sign out</button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

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
    <div className="grid h-dvh overflow-hidden grid-cols-[215px_minmax(0,1fr)] bg-page text-[#eeeef4] max-[1050px]:grid-cols-[170px_minmax(0,1fr)] max-[650px]:grid-cols-1 max-[650px]:grid-rows-[auto_minmax(0,1fr)]">
      <aside className="min-w-0 min-h-0 overflow-y-auto flex flex-col gap-[30px] border-r border-[#2b2c35] bg-[#17181e] px-[18px] py-[30px] max-[650px]:gap-[15px] max-[650px]:border-r-0 max-[650px]:border-b max-[650px]:border-[#2b2c35] max-[650px]:p-4">
        <a
          className="flex items-center gap-2 text-[23px] font-extrabold max-[1050px]:text-lg"
          href="/admin"
        >
          <ShieldCheck className="text-brand" /> altitude
          <span className="text-[9px] text-brand">ADMIN</span>
        </a>
        <nav
          className="min-w-0 grid gap-[5px] max-[650px]:flex max-[650px]:overflow-x-auto"
          aria-label="Administration"
        >
          {sections.map((item) => (
            <a
              aria-current={section === item ? "page" : undefined}
              className="flex items-center gap-2.5 rounded-lg p-3 text-[#aaacb9] hover:bg-[#fa416418] hover:text-brand-focus aria-[current]:bg-[#fa416418] aria-[current]:text-brand-focus max-[650px]:shrink-0"
              key={item}
              href={item === "overview" ? "/admin" : `/admin/${item}`}
            >
              <LayoutDashboard size={16} />
              {label(item)}
            </a>
          ))}
        </nav>
        <a className="flex items-center gap-2.5 max-[650px]:text-xs" href="/">
          <ArrowLeft size={16} /> Back to game
        </a>
      </aside>
      <main
        aria-label="Admin content"
        className="min-h-0 overflow-y-auto min-w-0 max-w-[1900px] p-8 max-[1050px]:p-5 max-[650px]:p-[15px]"
      >
        <header className="mb-7 flex items-center justify-between gap-3 max-[650px]:items-start">
          <div>
            <small className="text-[10px] tracking-[1.5px] text-[#898c9d]">
              OPERATIONS / {label(section).toUpperCase()}
            </small>
            <h1 className="mt-2 mb-2 text-[30px] font-[650] tracking-[-1.05px] max-[650px]:text-2xl">
              {label(section)}
              {id ? ` #${id}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-4 max-[650px]:flex-col max-[650px]:items-end max-[650px]:gap-2">
            <span>{username}</span>
            <button
              className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
              onClick={() => session.logout()}
            >
              Sign out
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

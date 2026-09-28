import { useGameContext } from "@/features/game/state/game.context";
import { useState } from "react";
import {
  Plus,
  Menu,
  X,
  Volume2,
  VolumeX,
  Settings2,
  HelpCircle,
  User,
} from "lucide-react";
import { currency } from "@/utils/format";

export function Header() {
  const { game, setModal, sound } = useGameContext();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#ffffff09] bg-(--color-header) px-4 max-[600px]:h-12.5 max-[600px]:px-3">
      {/* --- LEFT: LOGO --- */}
      <div className="flex items-center gap-6">
        <a
          href="/"
          className="flex items-center text-[24px] font-extrabold leading-none tracking-[-1.5px] max-[600px]:text-[20px]"
          aria-label="Altitude home"
        >
          <span>
            altitude<span className="text-brand"></span>
          </span>
        </a>
      </div>

      {/* --- RIGHT: ACTIONS --- */}
      <div className="flex items-center gap-3 max-[600px]:gap-2">
        {/* Wallet Balance */}
        <div className="flex items-center gap-2.75 max-[600px]:gap-1.5">
          <div className="flex flex-col items-end justify-center">
            <strong className="text-[15px] leading-none tabular-nums max-[600px]:text-[13px]">
              {!game.balanceLoaded ? "—" : currency(game.balance)}{" "}
              <span className="ml-0.5 text-[10px] font-medium text-[#96969f] max-[600px]:text-[9px]">
                RWF
              </span>
            </strong>
          </div>
        </div>

        {/* Deposit Button */}
        <button
          aria-label="Deposit"
          className="ml-1 flex h-8 items-center justify-center gap-1.75 rounded-[7px] border border-[#ff6782] bg-brand-btn px-3.75 text-xs font-semibold shadow-[0_3px_20px_#f4456514] transition hover:brightness-110 active:scale-95 max-[600px]:ml-0 max-[600px]:h-7.5 max-[600px]:w-7.5 max-[600px]:p-0"
          onClick={() => setModal("wallet")}
        >
          <Plus size={16} />
          <span className="max-[600px]:hidden">Deposit</span>
        </button>

        {/* Menu Toggle (Three Lines) */}
        <button
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-[#898994] transition hover:text-white max-[600px]:ml-0"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* --- DROPDOWN MENU --- */}
      {menuOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 top-14 z-40 bg-black/40 max-[600px]:top-12.5"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute top-15 right-4 z-50 w-55 overflow-hidden rounded-[10px] border border-[#34343c] bg-[#202127] p-1.5 shadow-[0_15px_40px_#0006] max-[600px]:top-13.5 max-[600px]:right-3">
            {/* User Profile Section */}
            <div className="mb-1 flex items-center gap-3 rounded-md bg-[#2a2b31] p-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full border border-[#69404b] bg-[#3d2b31] text-[10px] text-[#f1b8c5]">
                {game.user?.username.slice(0, 2).toUpperCase() ?? "IN"}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">
                  {game.user?.username ?? "Guest"}
                </span>
                <button
                  onClick={() => {
                    setModal("profile");
                    setMenuOpen(false);
                  }}
                  className="text-left text-[10px] text-[#898994] hover:text-white"
                >
                  View Profile
                </button>
              </div>
            </div>

            <nav
              aria-label="Account pages"
              className="mb-2 flex flex-col gap-2 p-2 text-xs"
            >
              <a href="/deposits">Deposits</a>
              <a href="/withdrawals">Withdrawals</a>
              <a href="/transactions">Transactions</a>
              <a href="/fairness">Provably fair</a>
            </nav>
            {/* Menu Items */}
            <div className="flex flex-col">
              <MenuButton
                icon={<HelpCircle size={16} />}
                label="How To Play"
                onClick={() => {
                  setModal("help");
                  setMenuOpen(false);
                }}
              />
              <MenuButton
                icon={<Settings2 size={16} />}
                label="Settings"
                onClick={() => {
                  setModal("settings");
                  setMenuOpen(false);
                }}
              />

              {/* Divider */}
              <div className="my-1 h-px w-full bg-[#ffffff0a]" />

              {/* Sound Toggle */}
              <button
                onClick={sound.toggle}
                className="flex w-full items-center justify-between rounded-[5px] px-3 py-2.5 text-xs text-[#898994] transition hover:bg-[#2f303a] hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  {sound.enabled ? (
                    <Volume2 size={16} />
                  ) : (
                    <VolumeX size={16} />
                  )}
                  <span>Sound</span>
                </div>
                {/* Modern Toggle Switch */}
                <div
                  className={`h-3.5 w-7 rounded-full p-0.5 transition-colors ${sound.enabled ? "bg-brand-btn" : "bg-[#3a3b42]"}`}
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full bg-white transition-transform ${sound.enabled ? "translate-x-3.5" : "translate-x-0"}`}
                  />
                </div>
              </button>

              {/* Admin Link (if applicable) */}
              {game.user?.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-xs text-[#ff6782] transition hover:bg-[#2f303a]"
                >
                  <User size={16} />
                  <span>Admin Dashboard</span>
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

// Helper component for standard menu items
function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-xs text-[#898994] transition hover:bg-[#2f303a] hover:text-white"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

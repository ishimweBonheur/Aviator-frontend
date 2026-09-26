import { useApp } from "@/store/app.store";
import { useState } from "react";
import {
  ArrowUpRight,
  Plane,
  Wallet,
  Plus,
  Volume2,
  VolumeX,
  Settings2,
  Menu,
} from "lucide-react";
import { currency } from "@/utils/format";
export function Header() {
  const { game, backend, setModal, sound } = useApp();
  const [menu, setMenu] = useState(false);
  return (
    <header className="header">
      <a href="#" className="brand" aria-label="Altitude home">
        <span className="brand-mark">
          <Plane size={24} fill="currentColor" />
        </span>
        <span>
          altitude<span className="brand-period">.</span>
          <small>THE SKY IS JUST THE START</small>
        </span>
      </a>
      <nav className="desktop-nav">
        {backend && game.user?.role === "ADMIN" && <a href="/admin">Admin dashboard</a>}
        <span className="nav-active">
          <Plane size={15} /> Crash
        </span>
        <button onClick={() => setModal("help")}>
          How to play <ArrowUpRight size={12} />
        </button>
      </nav>
      <div className="header-right">
        <div className="wallet">
          <Wallet size={17} />
          <div>
            <small>{backend ? "WALLET BALANCE" : "DEMO BALANCE"}</small>
            <strong>
              {backend && !game.balanceLoaded ? "—" : currency(game.balance)}{" "}
              <span>RWF</span>
            </strong>
          </div>
        </div>
        <button
          aria-label="Deposit"
          className="deposit-button"
          onClick={() => setModal("wallet")}
        >
          <Plus size={16} />
          <span>Deposit</span>
        </button>
        <div className="header-divider" />
        <button
          className="icon-button sound-button"
          aria-label={sound.enabled ? "Mute sound" : "Enable sound"}
          onClick={sound.toggle}
        >
          {sound.enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
        <button
          className="icon-button settings-button"
          aria-label="Settings"
          onClick={() => setModal("settings")}
        >
          <Settings2 size={19} />
        </button>
        <button
          className="profile-button"
          aria-label="Open profile"
          onClick={() => setModal("profile")}
        >
          {backend
            ? (game.user?.username.slice(0, 2).toUpperCase() ?? "IN")
            : "JD"}
        </button>
        <button
          className="icon-button menu-button"
          aria-label="Menu"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <Menu size={20} />
        </button>
      </div>
      {menu && (
        <div className="menu-dropdown">
          {backend && game.user?.role === "ADMIN" && <a href="/admin">Admin dashboard</a>}
          {(
            [
              "profile",
              "wallet",
              "settings",
              "help",
              "history",
              "integration",
            ] as const
          ).map((item) => (
            <button
              key={item}
              onClick={() => {
                setModal(item);
                setMenu(false);
              }}
            >
              {item === "help" ? "How to play" : item}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

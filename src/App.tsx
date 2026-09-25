import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Headphones,
  History,
  Menu,
  Plane,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { GameCanvas } from "./components/GameCanvas";
import { BetPanel, Toggle } from "./components/BetPanel";
import { LiveBets } from "./components/LiveBets";
import { FairnessView } from "./components/FairnessView";
import { BackendAccount } from "./components/BackendAccount";
import { IntegrationStatus } from "./components/IntegrationStatus";
import { useGameEngine } from "./hooks/useGameEngine";
import { useSound } from "./hooks/useSound";
import { gameService } from "./services/gameService";
import { currency, multiplierColor } from "./utils/format";
import "./App.css";
type Modal =
  "wallet" | "profile" | "settings" | "help" | "history" | "integration" | null;
export default function App() {
  const game = useGameEngine();
  const backend = game.mode === "backend";
  const [modal, setModal] = useState<Modal>(null);
  const [menu, setMenu] = useState(false);
  const [reduced, setReduced] = useState(false);
  const sound = useSound(
    game.round.status,
    game.bets.filter((b) => b.status === "CASHED_OUT").length,
  );
  const previous = useRef(new Map<string, string>());
  const previousStatus = useRef(game.round.status);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    game.bets.forEach((b) => {
      if (
        b.status === "CASHED_OUT" &&
        previous.current.get(b.id) !== "CASHED_OUT"
      )
        toast.success(
          `Cashed out at ${b.cashOutMultiplier?.toFixed(2)}x · Won ${currency(b.potentialWin)} RWF`,
        );
      previous.current.set(b.id, b.status);
    });
    if (game.round.status === "CRASHED" && previousStatus.current !== "CRASHED")
      toast(`Round crashed at ${game.round.multiplier.toFixed(2)}x`);
    previousStatus.current = game.round.status;
  }, [game]);
  useEffect(() => {
    if (!modal) return;
    const active = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
      if (event.key === "Tab") {
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(".modal button, .modal input"),
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      active?.focus();
    };
  }, [modal]);
  const wagered = game.players.reduce((sum, p) => sum + p.amount, 0);
  return (
    <div className={`app min-h-screen ${reduced ? "reduce-motion" : ""}`}>
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
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span /> A LITTLE COURAGE. A LITTLE ALTITUDE.
            </div>
            <h1>
              Catch your next high<span>.</span>
            </h1>
            <p>Place your bet. Watch it climb. Make your move.</p>
          </div>
          <button
            className="demo-badge"
            onClick={() => setModal("integration")}
          >
            <span className="pulse-dot" />{" "}
            {backend
              ? `BACKEND · ${game.connection?.toUpperCase()}`
              : "DEMO MODE"}{" "}
            <CircleHelp size={13} />
          </button>
        </div>
        {backend && (
          <div className="connection-banner" role="status">
            <span>
              {game.error ||
                (game.user
                  ? `Signed in as ${game.user.username}. Bets are submitted to the backend wallet.`
                  : "Backend mode. Sign in to place bets with your server account.")}
            </span>
            <button
              onClick={() => setModal(game.user ? "integration" : "profile")}
            >
              {game.user ? "Integration status" : "Sign in"}
            </button>
          </div>
        )}
        <div className="game-layout">
          <div className="game-column">
            <section className="history-bar" aria-label="Previous rounds">
              <span className="history-title">
                <History size={15} /> <span>Recent flights</span>
              </span>
              <div className="history-values">
                {backend && !game.history.length && (
                  <span className="panel-note">
                    Results appear as connected rounds finish
                  </span>
                )}
                {game.history.map((value, i) => (
                  <span
                    key={`${i}-${value}`}
                    className={`history-chip ${multiplierColor(value)}`}
                  >
                    {value.toFixed(2)}×
                  </span>
                ))}
              </div>
              <button
                className="history-more icon-button"
                aria-label="View round history"
                onClick={() => setModal("history")}
              >
                <ChevronDown size={16} />
              </button>
            </section>
            <GameCanvas game={game} />
            <div className="under-canvas">
              <span>
                <ShieldCheck size={13} />{" "}
                {backend
                  ? "Server-authoritative rounds and wallet"
                  : "Original flight. Practice credits."}
              </span>
              <button onClick={() => setModal("help")}>
                <CircleHelp size={13} /> How to play
              </button>
            </div>
            <div className="bet-panels">
              {[0, 1].map((panel) => (
                <BetPanel key={panel} panel={panel} game={game} />
              ))}
            </div>
            <section className="stats">
              <div>
                <span className="stat-icon">
                  <Users size={18} />
                </span>
                <span>
                  <small>Players on board</small>
                  <strong>
                    {backend ? "Unavailable" : game.players.length}
                    {!backend && <span className="stat-tag">LIVE</span>}
                  </strong>
                </span>
              </div>
              <div>
                <span className="stat-icon">
                  <Wallet size={18} />
                </span>
                <span>
                  <small>Total wagered</small>
                  <strong>
                    {backend ? "Unavailable" : currency(wagered)}{" "}
                    {!backend && <em>RWF</em>}
                  </strong>
                </span>
              </div>
              <div>
                <span className="stat-icon gold">
                  <Trophy size={18} />
                </span>
                <span>
                  <small>Largest cash out</small>
                  <strong>
                    {backend
                      ? "Unavailable"
                      : currency(
                          Math.max(
                            0,
                            ...game.players
                              .filter(
                                (p) =>
                                  ["FLYING", "CRASHED"].includes(
                                    game.round.status,
                                  ) && p.target <= game.round.multiplier,
                              )
                              .map((p) => p.amount * p.target),
                          ),
                        )}{" "}
                    {!backend && <em>RWF</em>}
                  </strong>
                </span>
              </div>
            </section>
            <section className="flight-tip">
              <div className="tip-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <strong>Your flight. Your call.</strong>
                <p>
                  {backend
                    ? "Bets join the upcoming round while the current flight continues. Cash out uses the multiplier confirmed by the server."
                    : "Cash out before the plane flies away. Set an auto cash out to fly on your terms."}
                </p>
              </div>
              <ArrowUpRight size={20} />
            </section>
          </div>
          <LiveBets game={game} />
        </div>
        <footer>
          <span className="footer-brand">
            <Plane size={15} /> altitude.
          </span>
          <span>Built for the thrill. Play for the experience.</span>
          <div>
            <span className="age-badge">18+</span>
            <button onClick={() => setModal("help")}>Play responsibly</button>
            <span className="footer-divider" />
            <button onClick={() => setModal("help")}>
              <Headphones size={13} /> Help center
            </button>
          </div>
        </footer>
        <div className="demo-disclaimer">
          {backend
            ? "Connected to your backend. Balances and bets are server-managed. SANDBOX deposits are for local testing; external payments remain pending."
            : "Demo experience only. All balances, bets, and player activity are simulated. No real money is used."}
        </div>
      </main>
      <AnimatePresence>
        {modal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="modal"
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeRef}
                className="modal-close icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
              <span className="modal-symbol">
                {modal === "wallet" ? (
                  <Wallet />
                ) : modal === "history" ? (
                  <History />
                ) : modal === "settings" ? (
                  <Settings2 />
                ) : modal === "profile" ? (
                  <Users />
                ) : (
                  <Plane />
                )}
              </span>
              <h2 id="modal-title">
                {modal === "integration"
                  ? "Backend integration"
                  : modal === "wallet"
                    ? "Fuel your next flight"
                    : modal === "history"
                      ? "Recent flights"
                      : modal === "settings"
                        ? "Your cockpit"
                        : modal === "profile"
                          ? backend
                            ? "Your account"
                            : "Welcome aboard, Jordan"
                          : "Ready for takeoff?"}
              </h2>
              {modal === "integration" && (
                <IntegrationStatus backend={backend} />
              )}
              {backend && (modal === "wallet" || modal === "profile") && (
                <BackendAccount game={game} wallet={modal === "wallet"} />
              )}
              {modal === "wallet" && !backend && (
                <>
                  <p>
                    This is a demo wallet. Add free practice credits to explore
                    the game.
                  </p>
                  <div className="modal-balance">
                    <small>AVAILABLE DEMO BALANCE</small>
                    <strong>
                      {currency(game.balance)} <span>RWF</span>
                    </strong>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      gameService.addDemoFunds();
                      toast.success("10,000 RWF demo credits added");
                      setModal(null);
                    }}
                  >
                    <Plus size={18} /> Add 10,000 demo RWF
                  </button>
                  <small className="modal-note">
                    No payments. No deposits of real money.
                  </small>
                </>
              )}
              {modal === "help" && (
                <>
                  <p>A simple flight. A perfectly timed exit.</p>
                  <ol className="instructions">
                    <li>
                      <strong>Place your bet</strong>
                      <span>
                        {backend
                          ? "Choose an amount for the open upcoming round. Each panel shows the target round number."
                          : "Choose an amount during the countdown. Use either or both bet panels."}
                      </span>
                    </li>
                    <li>
                      <strong>Watch your multiplier climb</strong>
                      <span>
                        Your potential return grows while the aircraft is in
                        flight.
                      </span>
                    </li>
                    <li>
                      <strong>Cash out before it flies away</strong>
                      <span>
                        Cash out to receive your bet × multiplier. If the round
                        crashes first, the bet is lost.
                      </span>
                    </li>
                  </ol>
                  <div className="info-box">
                    <ShieldCheck size={19} />
                    <span>
                      {backend
                        ? "Round state, accepted bets, and payouts come from your Go backend. Cancel during betting; cash out during flight. Automatic cash-out is not implemented."
                        : "Practice credits only. Outcomes are randomly simulated, not cryptographically verified. Auto bet repeats each round until disabled or funds run out."}
                    </span>
                  </div>
                </>
              )}
              {modal === "settings" && (
                <>
                  <p>Make yourself comfortable.</p>
                  <div className="setting">
                    <span>Game sounds</span>
                    <Toggle
                      label="Game sounds"
                      checked={sound.enabled}
                      onChange={sound.toggle}
                    />
                  </div>
                  <div className="setting">
                    <span>Reduce decorative motion</span>
                    <Toggle
                      label="Reduce decorative motion"
                      checked={reduced}
                      onChange={() => setReduced(!reduced)}
                    />
                  </div>
                  <div className="info-box">
                    <Check size={18} /> Settings apply for this session.
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => setModal("integration")}
                  >
                    Backend integration and game mode
                  </button>
                </>
              )}
              {modal === "profile" && !backend && (
                <>
                  <p>You’re flying as a guest in this demo session.</p>
                  <div className="profile-card">
                    <span className="profile-button">JD</span>
                    <div>
                      <strong>Jordan D.</strong>
                      <small>Demo explorer · Session wallet</small>
                    </div>
                  </div>
                  <div className="setting">
                    <span>Bets placed</span>
                    <strong>
                      {game.bets.filter((b) => b.status !== "CANCELLED").length}
                    </strong>
                  </div>
                  <div className="setting">
                    <span>Successful cash outs</span>
                    <strong className="green">
                      {
                        game.bets.filter((b) => b.status === "CASHED_OUT")
                          .length
                      }
                    </strong>
                  </div>
                  <p className="modal-note">
                    The latest 200 bets are kept in memory. Reloading starts a
                    fresh session.
                  </p>
                </>
              )}
              {modal === "history" && backend && <FairnessView />}
              {modal === "history" && !backend && (
                <>
                  <p>
                    {backend
                      ? "Observed this session, newest first. A persistent round-history endpoint is still needed."
                      : "Most recent simulated results, newest first."}
                  </p>
                  <div className="history-grid">
                    {game.history.map((n, i) => (
                      <div key={i}>
                        <strong className={multiplierColor(n)}>
                          {n.toFixed(2)}×
                        </strong>
                        <small>{i === 0 ? "Latest" : `${i} rounds ago`}</small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}

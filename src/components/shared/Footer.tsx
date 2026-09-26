import { useApp } from "@/store/app.store";
import { Plane, Headphones } from "lucide-react";
export function Footer() {
  const { backend, setModal } = useApp();
  return (
    <>
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
    </>
  );
}

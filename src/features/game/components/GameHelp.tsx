import { useApp } from "@/store/app.store";
import { ShieldCheck } from "lucide-react";
export function GameHelp() {
  const { backend } = useApp();
  return (
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
            Your potential return grows while the aircraft is in flight.
          </span>
        </li>
        <li>
          <strong>Cash out before it flies away</strong>
          <span>
            Cash out to receive your bet × multiplier. If the round crashes
            first, the bet is lost.
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
  );
}

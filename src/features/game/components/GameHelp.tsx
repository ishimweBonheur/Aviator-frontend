import { ShieldCheck } from "lucide-react";
export function GameHelp() {
  return (
    <>
      <p>A simple flight. A perfectly timed exit.</p>
      <ol className="instructions">
        <li>
          <strong>Place your bet</strong>
          <span>
            {
              "Choose an amount for the open upcoming round. Each panel shows the target round number."
            }
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
          {
            "Round state, accepted bets, and payouts come from your Go backend. Cancel during betting; cash out during flight. Automatic bets and cash-out targets run on the server."
          }
        </span>
      </div>
    </>
  );
}

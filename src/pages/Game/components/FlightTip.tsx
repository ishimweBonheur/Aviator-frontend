import { Sparkles, ArrowUpRight } from "lucide-react";
export function FlightTip() {
  return (
    <section className="flight-tip">
      <div className="tip-icon">
        <Sparkles size={20} />
      </div>
      <div>
        <strong>Your flight. Your call.</strong>
        <p>
          {
            "Place or cancel bets during the countdown between flights. Cash out uses the multiplier confirmed by the server."
          }
        </p>
      </div>
      <ArrowUpRight size={20} />
    </section>
  );
}

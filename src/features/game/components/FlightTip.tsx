import { useApp } from "@/store/app.store";
import { Sparkles, ArrowUpRight } from "lucide-react";
export function FlightTip() {
  const { backend } = useApp();
  return (
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
  );
}

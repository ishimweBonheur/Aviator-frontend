import { useApp } from "@/store/app.store";
import { History, ChevronDown } from "lucide-react";
import { multiplierColor } from "@/utils/format";
export function RoundHistory() {
  const { game, backend, setModal } = useApp();
  return (
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
  );
}

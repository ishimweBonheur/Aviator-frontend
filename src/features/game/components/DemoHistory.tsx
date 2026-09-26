import { useApp } from "@/store/app.store";
import { multiplierColor } from "@/utils/format";
export function DemoHistory() {
  const { game, backend } = useApp();
  return (
    <>
      <p>
        {backend
          ? "Observed this session, newest first. A persistent round-history endpoint is still needed."
          : "Most recent simulated results, newest first."}
      </p>
      <div className="history-grid">
        {game.history.map((n, i) => (
          <div key={i}>
            <strong className={multiplierColor(n)}>{n.toFixed(2)}×</strong>
            <small>{i === 0 ? "Latest" : `${i} rounds ago`}</small>
          </div>
        ))}
      </div>
    </>
  );
}

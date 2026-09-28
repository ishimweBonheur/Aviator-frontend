import type { Row } from "./admin.api";
import { display, label } from "./display";
const names: Record<string, string> = {
  total_player_balances: "Player wallet liability",
  deposits: "Completed deposits",
  withdrawals: "Completed withdrawals",
  rtp_percent: "RTP (%)",
  house_margin_percent: "House margin (%)",
  ggr: "GGR",
};
export function Metrics({
  data,
  keys = Object.keys(data),
}: {
  data: Row;
  keys?: string[];
}) {
  return (
    <div className="admin-metrics">
      {keys
        .filter(
          (key) => !Array.isArray(data[key]) && typeof data[key] !== "object",
        )
        .map((key) => (
          <article className="admin-card" key={key}>
            <span>{names[key] ?? label(key)}</span>
            <strong>{display(data[key])}</strong>
          </article>
        ))}
    </div>
  );
}

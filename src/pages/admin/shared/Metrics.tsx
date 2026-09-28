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
    <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(185px,1fr))] gap-3.5 max-[650px]:grid-cols-2 max-[650px]:gap-2.5">
      {keys
        .filter(
          (key) => !Array.isArray(data[key]) && typeof data[key] !== "object",
        )
        .map((key) => (
          <article
            className="min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5"
            key={key}
          >
            <span className="mb-3 block text-[11px] tracking-[0.5px] text-[#9699a9] uppercase">
              {names[key] ?? label(key)}
            </span>
            <strong className="block text-[23px] wrap-anywhere tabular-nums max-[650px]:text-lg">
              {display(data[key])}
            </strong>
          </article>
        ))}
    </div>
  );
}

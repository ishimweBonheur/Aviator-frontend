import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type { Row } from "../shared/admin.api";
Chart.register(...registerables);

export function AdminCharts({ daily }: { daily: Row[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rtp = useRef<HTMLCanvasElement>(null);
  const activity = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !rtp.current || !activity.current || !daily.length)
      return;
    const labels = daily.map((row) => String(row.day));
    const chart = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          ["wagered", "Wagers", "#8f91ff"],
          ["payouts", "Payouts", "#ffb75c"],
          ["ggr", "GGR", "#fa4164"],
          ["deposits", "Deposits", "#52d9ac"],
          ["withdrawals", "Withdrawals", "#62b7fa"],
        ].map(([key, label, color]) => ({
          label,
          data: daily.map((row) => Number(row[key])),
          borderColor: color,
          backgroundColor: color,
          pointRadius: 2,
          borderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: { legend: { labels: { color: "#c4c6d0" } } },
        scales: {
          x: { ticks: { color: "#9396a5", maxTicksLimit: 8 } },
          y: {
            title: { display: true, text: "RWF", color: "#9396a5" },
            ticks: { color: "#9396a5" },
          },
        },
      },
    });
    const percent = new Chart(rtp.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Realized RTP (%)",
            data: daily.map((row) => Number(row.rtp_percent)),
            borderColor: "#52d9ac",
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#c4c6d0" } } },
        scales: {
          x: { ticks: { color: "#9396a5", maxTicksLimit: 8 } },
          y: { ticks: { color: "#9396a5" } },
        },
      },
    });
    const counts = new Chart(activity.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Settled bets",
            data: daily.map((row) =>
              row.bet_count == null ? null : Number(row.bet_count),
            ),
            backgroundColor: "#8f91ff",
          },
          {
            label: "Active players",
            data: daily.map((row) =>
              row.active_players == null ? null : Number(row.active_players),
            ),
            backgroundColor: "#52d9ac",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#c4c6d0" } } },
        scales: {
          x: { ticks: { color: "#9396a5", maxTicksLimit: 8 } },
          y: { beginAtZero: true, ticks: { color: "#9396a5", precision: 0 } },
        },
      },
    });
    return () => {
      chart.destroy();
      percent.destroy();
      counts.destroy();
    };
  }, [daily]);
  if (!daily.length)
    return (
      <p className="p-[30px] text-center text-[#a9adbd]">
        No completed activity in this period.
      </p>
    );
  return (
    <div className="grid grid-cols-[1.5fr_1fr] gap-[18px] max-[1050px]:grid-cols-1">
      <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
        <h2 className="mb-[18px] text-[15px]">Daily financial activity</h2>
        <div className="relative h-[280px]">
          <canvas
            ref={ref}
            role="img"
            aria-label="Daily wagers, payouts, GGR, deposits and withdrawals. Values are in the daily table below."
          />
        </div>
      </section>
      <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
        <h2 className="mb-[18px] text-[15px]">Return to player</h2>
        <div className="relative h-[280px]">
          <canvas
            ref={rtp}
            role="img"
            aria-label="Daily realized RTP. Values are in the daily table below."
          />
        </div>
      </section>
      <section className="mb-4.5 min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 min-[1051px]:col-span-2">
        <h2 className="mb-4.5 text-[15px]">Bet volume and player activity</h2>
        <div className="relative h-70">
          <canvas
            ref={activity}
            role="img"
            aria-label="Daily settled bets and active players. Values are in the daily table below."
          />
        </div>
      </section>
    </div>
  );
}

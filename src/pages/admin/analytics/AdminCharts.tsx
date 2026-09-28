import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type { Row } from "../shared/admin.api";
Chart.register(...registerables);

export function AdminCharts({ daily }: { daily: Row[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rtp = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !rtp.current || !daily.length) return;
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
    return () => {
      chart.destroy();
      percent.destroy();
    };
  }, [daily]);
  if (!daily.length)
    return <p className="admin-empty">No completed activity in this period.</p>;
  return (
    <div className="admin-charts">
      <section className="admin-card">
        <h2>Daily financial activity</h2>
        <div className="admin-chart">
          <canvas
            ref={ref}
            role="img"
            aria-label="Daily wagers, payouts, GGR, deposits and withdrawals. Values are in the daily table below."
          />
        </div>
      </section>
      <section className="admin-card">
        <h2>Return to player</h2>
        <div className="admin-chart">
          <canvas
            ref={rtp}
            role="img"
            aria-label="Daily realized RTP. Values are in the daily table below."
          />
        </div>
      </section>
    </div>
  );
}

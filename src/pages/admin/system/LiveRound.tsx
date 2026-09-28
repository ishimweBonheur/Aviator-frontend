import { useRoundMonitor } from "@/features/game/hooks/useRoundMonitor";
import type { Row } from "../shared/admin.api";
export function LiveRound({ snapshot }: { snapshot: Row }) {
  const running = snapshot.running as Row | null;
  const upcoming = snapshot.upcoming as Row | null;
  const confirmed = running ?? upcoming;
  const event = useRoundMonitor(
    confirmed
      ? {
          id: Number(confirmed.id),
          roundNumber: Number(confirmed.round_number),
          status: String(confirmed.status),
        }
      : undefined,
  );
  const live =
    (event.connected || ["CRASHED", "SETTLED"].includes(event.status)) &&
    event.roundId >= Number(running?.id ?? upcoming?.id ?? 0);
  const status = live
    ? event.status
    : String(running?.status ?? upcoming?.status ?? "WAITING");
  const current = live
    ? "#" + event.roundNumber + " · " + status
    : running
      ? "#" + running.round_number + " · " + status
      : "None";
  const multiplier =
    status === "RUNNING"
      ? live
        ? event.multiplier
        : snapshot.current_multiplier
      : undefined;
  const betting = ["BETTING_OPEN", "BETTING_CLOSED"].includes(status);
  return (
    <section className="mb-[18px] min-w-0 rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
      <h2 className="mb-[18px] text-[15px]">Live round monitor</h2>
      <p className="my-4 text-xs leading-[1.7] text-[#999cac]">
        {live
          ? "Connected to game events"
          : "Showing last server snapshot; waiting for game events"}
      </p>
      <div className="admin-live grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-5">
        <div>
          <span className="mb-3 block text-[11px] tracking-[0.5px] text-[#9699a9] uppercase">Current multiplier</span>
          <strong className="wrap-anywhere">{multiplier ? String(multiplier) + "×" : "—"}</strong>
        </div>
        <div>
          <span className="mb-3 block text-[11px] tracking-[0.5px] text-[#9699a9] uppercase">Current round</span>
          <strong className="wrap-anywhere">{current}</strong>
        </div>
        <div>
          <span className="mb-3 block text-[11px] tracking-[0.5px] text-[#9699a9] uppercase">Upcoming round</span>
          <strong className="wrap-anywhere">
            {betting
              ? "#" + (live ? event.roundNumber : upcoming?.round_number)
              : "None"}
          </strong>
        </div>
        <div>
          <span className="mb-3 block text-[11px] tracking-[0.5px] text-[#9699a9] uppercase">Betting countdown</span>
          <strong className="wrap-anywhere">
            {betting
              ? String(
                  live
                    ? (event.seconds ?? 0)
                    : (snapshot.seconds_remaining ?? 0),
                ) + "s"
              : "—"}
          </strong>
        </div>
        <div>
          <span className="mb-3 block text-[11px] tracking-[0.5px] text-[#9699a9] uppercase">Last reported betting close</span>
          <strong className="wrap-anywhere">
            {upcoming?.betting_closes_at
              ? new Date(String(upcoming.betting_closes_at)).toLocaleString()
              : "—"}
          </strong>
        </div>
      </div>
    </section>
  );
}

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
    <section className="admin-card">
      <h2>Live round monitor</h2>
      <p className="admin-note">
        {live
          ? "Connected to game events"
          : "Showing last server snapshot; waiting for game events"}
      </p>
      <div className="admin-live">
        <div>
          <span>Current multiplier</span>
          <strong>{multiplier ? String(multiplier) + "×" : "—"}</strong>
        </div>
        <div>
          <span>Current round</span>
          <strong>{current}</strong>
        </div>
        <div>
          <span>Upcoming round</span>
          <strong>
            {betting
              ? "#" + (live ? event.roundNumber : upcoming?.round_number)
              : "None"}
          </strong>
        </div>
        <div>
          <span>Betting countdown</span>
          <strong>
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
          <span>Last reported betting close</span>
          <strong>
            {upcoming?.betting_closes_at
              ? new Date(String(upcoming.betting_closes_at)).toLocaleString()
              : "—"}
          </strong>
        </div>
      </div>
    </section>
  );
}

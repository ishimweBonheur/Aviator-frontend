import { useApp } from "@/store/app.store";
import type { Row } from "./admin.api";

export function LiveRound({ snapshot }: { snapshot: Row }) {
  const { game } = useApp();
  const live = game.connection === "connected";
  const running = snapshot.running as Row | null;
  const upcoming = snapshot.upcoming as Row | null;
  const round = live
    ? game.round.id !== "0"
      ? `#${game.round.roundNumber} · ${game.round.status}`
      : "None"
    : running
      ? `#${running.round_number} · ${running.status}`
      : "None";
  const multiplier = live
    ? game.round.status === "FLYING"
      ? `${game.round.multiplier.toFixed(2)}×`
      : "—"
    : snapshot.current_multiplier
      ? `${snapshot.current_multiplier}×`
      : "—";
  return (
    <section className="admin-card">
      <h2>Live round monitor</h2>
      <p className="admin-note">
        {live
          ? "Connected to game events"
          : "Live connection unavailable; showing last server snapshot"}
      </p>
      <div className="admin-live">
        <div>
          <span>Current multiplier</span>
          <strong>{multiplier}</strong>
        </div>
        <div>
          <span>Current round</span>
          <strong>{round}</strong>
        </div>
        <div>
          <span>Upcoming round</span>
          <strong>
            {live
              ? game.bettingRound
                ? `#${game.bettingRound.roundNumber}`
                : "None"
              : upcoming
                ? `#${upcoming.round_number}`
                : "None"}
          </strong>
        </div>
        <div>
          <span>Betting countdown</span>
          <strong>
            {live && game.bettingRound ? `${game.countdown}s` : "—"}
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

import { useApp } from "@/store/app.store";

export function DemoProfile() {
  const { game } = useApp();
  return (
    <>
      <p>You’re flying as a guest in this demo session.</p>
      <div className="profile-card">
        <span className="profile-button">JD</span>
        <div>
          <strong>Jordan D.</strong>
          <small>Demo explorer · Session wallet</small>
        </div>
      </div>
      <div className="setting">
        <span>Bets placed</span>
        <strong>
          {game.bets.filter((b) => b.status !== "CANCELLED").length}
        </strong>
      </div>
      <div className="setting">
        <span>Successful cash outs</span>
        <strong className="green">
          {game.bets.filter((b) => b.status === "CASHED_OUT").length}
        </strong>
      </div>
      <p className="modal-note">
        The latest 200 bets are kept in memory. Reloading starts a fresh
        session.
      </p>
    </>
  );
}

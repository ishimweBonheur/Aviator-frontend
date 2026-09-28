import { Users, Wallet, Trophy } from "lucide-react";
export function GameStats() {
  return (
    <section className="stats">
      <div>
        <span className="stat-icon">
          <Users size={18} />
        </span>
        <span>
          <small>Players on board</small>
          <strong>{"Unavailable"}</strong>
        </span>
      </div>
      <div>
        <span className="stat-icon">
          <Wallet size={18} />
        </span>
        <span>
          <small>Total wagered</small>
          <strong>{"Unavailable"} </strong>
        </span>
      </div>
      <div>
        <span className="stat-icon gold">
          <Trophy size={18} />
        </span>
        <span>
          <small>Largest cash out</small>
          <strong>{"Unavailable"} </strong>
        </span>
      </div>
    </section>
  );
}

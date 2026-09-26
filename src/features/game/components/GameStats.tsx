import { useApp } from "@/store/app.store";
import { Users, Wallet, Trophy } from "lucide-react";
import { currency } from "@/utils/format";
export function GameStats() {
  const { game, backend } = useApp();
  const wagered = game.players.reduce((sum, p) => sum + p.amount, 0);
  return (
    <section className="stats">
      <div>
        <span className="stat-icon">
          <Users size={18} />
        </span>
        <span>
          <small>Players on board</small>
          <strong>
            {backend ? "Unavailable" : game.players.length}
            {!backend && <span className="stat-tag">LIVE</span>}
          </strong>
        </span>
      </div>
      <div>
        <span className="stat-icon">
          <Wallet size={18} />
        </span>
        <span>
          <small>Total wagered</small>
          <strong>
            {backend ? "Unavailable" : currency(wagered)}{" "}
            {!backend && <em>RWF</em>}
          </strong>
        </span>
      </div>
      <div>
        <span className="stat-icon gold">
          <Trophy size={18} />
        </span>
        <span>
          <small>Largest cash out</small>
          <strong>
            {backend
              ? "Unavailable"
              : currency(
                  Math.max(
                    0,
                    ...game.players
                      .filter(
                        (p) =>
                          ["FLYING", "CRASHED"].includes(game.round.status) &&
                          p.target <= game.round.multiplier,
                      )
                      .map((p) => p.amount * p.target),
                  ),
                )}{" "}
            {!backend && <em>RWF</em>}
          </strong>
        </span>
      </div>
    </section>
  );
}

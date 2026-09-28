import { useState } from "react";
import { ArrowDownUp, Trophy, Users } from "lucide-react";
import type { GameSnapshot } from "@/features/game/types/game.types";

import { currency } from "@/utils/format";
export function LiveBets({ game }: { game: GameSnapshot }) {
  const [tab, setTab] = useState("All bets");

  const rows =
    tab === "My bets"
      ? game.bets
          .filter((b) => b.status !== "CANCELLED")
          .map((b) => ({
            id: b.id,
            name: "You",
            amount: b.amount,
            target: b.cashOutMultiplier ?? 0,
            won: b.status === "CASHED_OUT",
            payout: b.potentialWin,
            color: "#dc8297",
            activity:
              b.status === "UNKNOWN"
                ? "Unconfirmed"
                : b.status === "LOST"
                  ? "Lost"
                  : b.status === "PENDING"
                    ? "Placed"
                    : "In flight",
            result: b.status === "LOST" ? "Lost" : "—",
          }))
      : [];
  return (
    <aside className="live-bets">
      <div className="live-heading">
        <h2>
          <Users size={17} /> Flight manifest
        </h2>
        <span className="live-pill">
          <span className="pulse-dot" /> LIVE
        </span>
      </div>
      <div className="live-tabs">
        {["All bets", "My bets", "Top"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "Top" && <Trophy size={13} />} {t}
            {t === "All bets" && <span>{"—"}</span>}
          </button>
        ))}
      </div>
      <div className="bets-summary">
        <span>
          {tab === "My bets" ? "Your flight history" : "On board this round"}
        </span>
        <strong>
          <Users size={13} /> {tab === "My bets" ? rows.length : "—"}
        </strong>
      </div>
      <div className="table-heading">
        <span>Player</span>
        <span>
          Bet <ArrowDownUp size={10} />
        </span>
        <span>Cash out</span>
      </div>
      <div className="players-list">
        {rows.length === 0 ? (
          <div className="empty-state">
            <Trophy size={25} />
            <strong>
              {tab !== "My bets"
                ? "Player feed not available"
                : tab === "My bets"
                  ? "Your journey starts here"
                  : "Who will fly the highest?"}
            </strong>
            <span>
              {tab !== "My bets"
                ? "The backend does not expose public bets or leaderboard data yet."
                : tab === "My bets"
                  ? "Place a bet to see acknowledged results from this session."
                  : "Successful cash outs appear here."}
            </span>
          </div>
        ) : (
          rows.map((p, i) => (
            <div
              key={p.id}
              className={`player-row ${p.won ? "player-won" : ""}`}
            >
              <div className="player">
                <span
                  className="avatar"
                  style={{ background: `${p.color}18`, color: p.color }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                  {i % 3 === 0 ? "•" : ""}
                </span>
                <span>
                  {p.name}
                  <small>
                    {p.won ? `${p.target.toFixed(2)}×` : p.activity}
                  </small>
                </span>
              </div>
              <span>
                {currency(p.amount)}
                <small>RWF</small>
              </span>
              <span className={p.won ? "green" : "dim"}>
                {p.won ? currency(p.payout) : p.result}
                {p.won && <small>RWF</small>}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="manifest-footer">
        <span className="pulse-dot" />{" "}
        {"Backend mode · My bets shows your account history"}
      </div>
    </aside>
  );
}

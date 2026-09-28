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
    <aside className="flex max-h-[831px] min-h-0 flex-col overflow-hidden rounded-[11px] border border-[#2d2a34] bg-[#19191f] min-[1440px]:max-h-[900px] max-[1100px]:max-h-[808px] max-[900px]:max-h-[450px] max-[600px]:max-h-[460px]">
      <div className="flex items-center justify-between px-[17px] py-[19px] max-[900px]:p-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold max-[600px]:text-[13px]">
          <Users size={17} className="text-[#a599b5]" /> Flight manifest
        </h2>
        
      </div>
      <div className="mx-[15px] flex gap-[15px] border-b border-[#302b36] max-[1100px]:gap-2 max-[900px]:max-w-[450px]">
        {["All bets", "My bets", "Top"].map((t) => (
          <button
            key={t}
            className={`flex flex-1 items-center justify-center gap-[5px] bg-transparent px-[3px] pt-[9px] pb-[13px] text-[10px] whitespace-nowrap max-[600px]:px-[5px] max-[600px]:py-3 max-[600px]:text-[11px] ${tab === t ? "border-b-2 border-[#f44a6a] text-[#f56986]" : "text-[#8e849a]"}`}
            onClick={() => setTab(t)}
          >
            {t === "Top" && <Trophy size={13} />} {t}
            {t === "All bets" && (
              <span className="rounded bg-[#472a37] px-[5px] py-[3px] text-[7px]">
                {"—"}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-between px-[17px] py-[15px] text-[9px] text-[#83798e] max-[600px]:text-[10px]">
        <span>
          {tab === "My bets" ? "Your flight history" : "On board this round"}
        </span>
        <strong className="flex items-center gap-[5px] text-[10px] font-medium text-[#c0b5cd]">
          <Users size={13} /> {tab === "My bets" ? rows.length : "—"}
        </strong>
      </div>
      <div className="grid grid-cols-[1.2fr_0.8fr_1fr] bg-[#141419] px-[17px] py-[9px] text-[8px] text-[#6d627a] max-[900px]:grid-cols-[1.2fr_1fr_1fr] max-[600px]:text-[9px]">
        <span>Player</span>
        <span className="flex items-center justify-end gap-1">
          Bet <ArrowDownUp size={10} />
        </span>
        <span className="text-right">Cash out</span>
      </div>
      <div className="min-h-[350px] max-h-[600px] flex-1 overflow-auto scrollbar-thin [scrollbar-color:#302a39_transparent] min-[1440px]:max-h-[675px] max-[900px]:min-h-[220px] max-[900px]:max-h-[260px]">
        {rows.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-[13px] p-[25px] text-center text-[#83728f]">
            <Trophy size={25} />
            <strong className="text-xs text-[#b4a1c2]">
              {tab !== "My bets"
                ? "Player feed not available"
                : tab === "My bets"
                  ? "Your journey starts here"
                  : "Who will fly the highest?"}
            </strong>
          </div>
        ) : (
          rows.map((p, i) => (
            <div
              key={p.id}
              className={`grid min-h-[53px] grid-cols-[1.2fr_0.8fr_1fr] items-center border-b border-[#ffffff03] px-[17px] py-2.5 text-[10px] even:bg-[#ffffff02] max-[1100px]:px-3 max-[900px]:grid-cols-[1.2fr_1fr_1fr] max-[600px]:px-[17px] max-[600px]:py-[11px] max-[600px]:text-[11px]`}
            >
              <div className="flex items-center gap-[7px]">
                <span
                  className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-[#ffffff08] text-[10px] font-semibold"
                  style={{ background: `${p.color}18`, color: p.color }}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                  {i % 3 === 0 ? "•" : ""}
                </span>
                <span className="text-[9px] text-[#b2a6be] max-[600px]:text-[10px]">
                  {p.name}
                  <small
                    className={`mt-1 block text-[7px] ${p.won ? "text-success-text" : "text-[#685f74]"}`}
                  >
                    {p.won ? `${p.target.toFixed(2)}×` : p.activity}
                  </small>
                </span>
              </div>
              <span className="text-right text-[10px] tabular-nums text-[#d1c5dc]">
                {currency(p.amount)}
                <small className="mt-1 block text-[7px] text-[#685f74]">
                  RWF
                </small>
              </span>
              <span
                className={`text-right text-[10px] tabular-nums ${p.won ? "text-success-text" : "text-[#6e6e7c]"}`}
              >
                {p.won ? currency(p.payout) : p.result}
                {p.won && (
                  <small className="mt-1 block text-[7px] text-[#62d5a488]">
                    RWF
                  </small>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    
    </aside>
  );
}

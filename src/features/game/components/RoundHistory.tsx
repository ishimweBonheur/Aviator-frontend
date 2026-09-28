import { useState } from "react";
import { useGameContext } from "@/features/game/state/game.context";
import { ChevronDown } from "lucide-react";
import { multiplierColor } from "@/utils/format";
export function RoundHistory() {
  const { game } = useGameContext();
  const [expanded, setExpanded] = useState(false);
  const recentRounds = game.history.slice(0, 54);
  return (
    <section
      className="overflow-hidden rounded-t-[10px] border border-[#292a32] bg-surface"
      aria-label="Previous rounds"
    >
      <div className="flex h-11.75 items-center gap-3.5 px-3.25 max-[600px]:h-10.75 max-[600px]:gap-2.25 max-[600px]:px-2.25">
        <div className="flex flex-1 gap-1.75 overflow-x-auto scrollbar-none mask-[linear-gradient(to_right,#000_92%,transparent)] max-[600px]:gap-1.5 [&::-webkit-scrollbar]:hidden">
          {!game.history.length && (
            <span className="mt-2.5 text-[10px] leading-[1.6] text-[#a69bad]">
              Results appear as connected rounds finish
            </span>
          )}
          {game.history.map((value, i) => (
            <span
              key={`${i}-${value}`}
              className={`rounded-[5px] px-2.25 py-1.25 text-[10px] font-semibold whitespace-nowrap tabular-nums max-[600px]:px-2 max-[600px]:py-1.25 max-[600px]:text-[9px] ${multiplierColor(value)}`}
            >
              {value.toFixed(2)}×
            </span>
          ))}
        </div>
        <button
          className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-md bg-transparent text-[#898994] max-[600px]:w-5.75"
          aria-label={expanded ? "Hide recent flights" : "Show recent flights"}
          aria-expanded={expanded}
          aria-controls="recent-flights-panel"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {expanded && (
        <div
          id="recent-flights-panel"
          className=" p-3"
        >
          <div className="grid grid-cols-9 gap-1.5 sm:grid-cols-18 xl:grid-cols-27">
            {recentRounds.map((value, i) => (
              <span
                key={`${i}-${value}`}
                className={`min-w-0 rounded-[5px] px-1 py-1.25 text-center text-[9px] font-semibold whitespace-nowrap tabular-nums ${multiplierColor(value)}`}
              >
                {value.toFixed(2)}×
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

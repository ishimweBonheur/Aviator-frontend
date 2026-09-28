import { Users, Wallet, Trophy } from "lucide-react";
export function GameStats() {
  return (
    <section className="mt-[18px] grid grid-cols-[1fr_1.3fr_1.3fr] gap-2.5 rounded-[9px] border border-[#2a2931] bg-[#18191e] px-3 py-4 min-[1440px]:px-[13px] min-[1440px]:py-5 max-[1100px]:px-1.5 max-[1100px]:py-3.5 max-[900px]:p-[17px] max-[600px]:mt-3.5 max-[600px]:gap-[3px] max-[600px]:px-[5px] max-[600px]:py-3.5">
      <div className="flex items-center gap-2.5 border-r border-[#302d36] px-2 max-[1100px]:gap-[7px] max-[1100px]:px-[5px] max-[900px]:gap-3.5 max-[600px]:gap-[5px] max-[600px]:px-[7px]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#27232e] text-[#a28bb8] max-[1100px]:h-[29px] max-[1100px]:w-[25px] max-[600px]:hidden">
          <Users size={18} />
        </span>
        <span>
          <small className="mb-[5px] block text-[8px] text-[#827c8c] max-[600px]:text-[7px] max-[600px]:whitespace-nowrap max-[359px]:text-[6px]">
            Players on board
          </small>
          <strong className="text-[13px] font-[550] whitespace-nowrap min-[1440px]:text-[13px] max-[1100px]:text-[11px] max-[900px]:text-sm max-[600px]:text-xs max-[359px]:text-[10px]">
            {"Unavailable"}
          </strong>
        </span>
      </div>
      <div className="flex items-center gap-2.5 border-r border-[#302d36] px-2 max-[1100px]:gap-[7px] max-[1100px]:px-[5px] max-[900px]:gap-3.5 max-[600px]:gap-[5px] max-[600px]:px-[7px]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#27232e] text-[#a28bb8] max-[1100px]:h-[29px] max-[1100px]:w-[25px] max-[600px]:hidden">
          <Wallet size={18} />
        </span>
        <span>
          <small className="mb-[5px] block text-[8px] text-[#827c8c] max-[600px]:text-[7px] max-[600px]:whitespace-nowrap max-[359px]:text-[6px]">
            Total wagered
          </small>
          <strong className="text-[13px] font-[550] whitespace-nowrap max-[1100px]:text-[11px] max-[900px]:text-sm max-[600px]:text-xs max-[359px]:text-[10px]">
            {"Unavailable"}{" "}
          </strong>
        </span>
      </div>
      <div className="flex items-center gap-2.5 px-2 max-[1100px]:gap-[7px] max-[1100px]:px-[5px] max-[900px]:gap-3.5 max-[600px]:gap-[5px] max-[600px]:px-[7px]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#302a20] text-[#c5a578] max-[1100px]:h-[29px] max-[1100px]:w-[25px] max-[600px]:hidden">
          <Trophy size={18} />
        </span>
        <span>
          <small className="mb-[5px] block text-[8px] text-[#827c8c] max-[600px]:text-[7px] max-[600px]:whitespace-nowrap max-[359px]:text-[6px]">
            Largest cash out
          </small>
          <strong className="text-[13px] font-[550] whitespace-nowrap max-[1100px]:text-[11px] max-[900px]:text-sm max-[600px]:text-xs max-[359px]:text-[10px]">
            {"Unavailable"}{" "}
          </strong>
        </span>
      </div>
    </section>
  );
}

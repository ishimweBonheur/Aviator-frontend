import { Sparkles, ArrowUpRight } from "lucide-react";
export function FlightTip() {
  return (
    <section className="mt-[17px] flex items-center gap-[13px] rounded-[9px] border border-[#3c283533] bg-[linear-gradient(100deg,#261d25,#19191f)] px-[19px] py-[17px] max-[1100px]:p-[13px] max-[600px]:mt-3.5 max-[600px]:gap-2.5 max-[600px]:px-[13px] max-[600px]:py-[15px]">
      <div className="grid h-[33px] w-[33px] shrink-0 place-items-center rounded-[9px] bg-[#422734] text-[#e39caa]">
        <Sparkles size={20} />
      </div>
      <div>
        <strong className="text-[11px] font-[550]">Your flight. Your call.</strong>
        <p className="mt-[5px] text-[9px] leading-[1.6] text-[#8b808d] max-[1100px]:text-[8px] max-[900px]:text-[10px] max-[600px]:text-[9px]">
          {
            "Place or cancel bets during the countdown between flights. Cash out uses the multiplier confirmed by the server."
          }
        </p>
      </div>
      <ArrowUpRight size={20} className="ml-auto shrink-0 text-[#916577] max-[600px]:hidden" />
    </section>
  );
}

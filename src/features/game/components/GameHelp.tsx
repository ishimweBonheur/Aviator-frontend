import { ShieldCheck } from "lucide-react";
export function GameHelp() {
  return (
    <>
      <p>A simple flight. A perfectly timed exit.</p>
      <ol className="my-6 pl-[23px]">
        <li className="mb-[22px] pl-[7px] text-[#f36583]">
          <strong className="mb-1.5 block text-[13px] text-[#e4d8ec]">
            Place your bet
          </strong>
          <span className="text-xs leading-[1.7] text-[#9e8ca9]">
            {
              "Choose an amount for the open upcoming round. Each panel shows the target round number."
            }
          </span>
        </li>
        <li className="mb-[22px] pl-[7px] text-[#f36583]">
          <strong className="mb-1.5 block text-[13px] text-[#e4d8ec]">
            Watch your multiplier climb
          </strong>
          <span className="text-xs leading-[1.7] text-[#9e8ca9]">
            Your potential return grows while the aircraft is in flight.
          </span>
        </li>
        <li className="mb-[22px] pl-[7px] text-[#f36583]">
          <strong className="mb-1.5 block text-[13px] text-[#e4d8ec]">
            Cash out before it flies away
          </strong>
          <span className="text-xs leading-[1.7] text-[#9e8ca9]">
            Cash out to receive your bet × multiplier. If the round crashes
            first, the bet is lost.
          </span>
        </li>
      </ol>
      <div className="mt-5 flex items-start gap-2.5 rounded-[7px] bg-[#2a242f] p-[15px] text-[11px] leading-[1.7] text-[#a292af]">
        <ShieldCheck size={19} className="shrink-0 text-[#bc91aa]" />
        <span>
          {
            "Round state, accepted bets, and payouts come from your Go backend. Cancel during betting; cash out during flight. Automatic bets and cash-out targets run on the server."
          }
        </span>
      </div>
    </>
  );
}

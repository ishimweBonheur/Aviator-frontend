import { Check } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
export function Settings({
  sound,
  reduced,
  onReduced,
  onIntegration,
}: {
  sound: { enabled: boolean; toggle: () => void };
  reduced: boolean;
  onReduced: () => void;
  onIntegration: () => void;
}) {
  return (
    <>
      <p>Make yourself comfortable.</p>
      <div className="flex items-center justify-between border-b border-[#3b303f] py-[22px] text-[13px]">
        <span>Game sounds</span>
        <Toggle
          label="Game sounds"
          checked={sound.enabled}
          onChange={sound.toggle}
        />
      </div>
      <div className="flex items-center justify-between border-b border-[#3b303f] py-[22px] text-[13px]">
        <span>Reduce decorative motion</span>
        <Toggle
          label="Reduce decorative motion"
          checked={reduced}
          onChange={onReduced}
        />
      </div>
      <div className="mt-5 flex items-start gap-2.5 rounded-[7px] bg-[#2a242f] p-[15px] text-[11px] leading-[1.7] text-[#a292af]">
        <Check size={18} className="shrink-0 text-[#bc91aa]" /> Settings apply
        for this session.
      </div>
      <button
        className="mt-[13px] flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#4c3a53] bg-[#28202f] p-3 text-xs"
        onClick={onIntegration}
      >
        Backend integration and game mode
      </button>
    </>
  );
}

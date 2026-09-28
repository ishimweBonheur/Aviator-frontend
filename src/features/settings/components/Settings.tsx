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
      <div className="setting">
        <span>Game sounds</span>
        <Toggle
          label="Game sounds"
          checked={sound.enabled}
          onChange={sound.toggle}
        />
      </div>
      <div className="setting">
        <span>Reduce decorative motion</span>
        <Toggle
          label="Reduce decorative motion"
          checked={reduced}
          onChange={onReduced}
        />
      </div>
      <div className="info-box">
        <Check size={18} /> Settings apply for this session.
      </div>
      <button className="secondary-button" onClick={onIntegration}>
        Backend integration and game mode
      </button>
    </>
  );
}

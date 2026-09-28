import { useGameContext } from "@/features/game/state/game.context";
import { ShieldCheck, CircleHelp } from "lucide-react";
export function GameInfo() {
  const { setModal } = useGameContext();
  return (
    <div className="under-canvas">
      <span>
        <ShieldCheck size={13} /> {"Server-authoritative rounds and wallet"}
      </span>
      <button onClick={() => setModal("help")}>
        <CircleHelp size={13} /> How to play
      </button>
    </div>
  );
}

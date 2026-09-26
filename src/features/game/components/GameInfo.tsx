import { useApp } from "@/store/app.store";
import { ShieldCheck, CircleHelp } from "lucide-react";
export function GameInfo() {
  const { backend, setModal } = useApp();
  return (
    <div className="under-canvas">
      <span>
        <ShieldCheck size={13} />{" "}
        {backend
          ? "Server-authoritative rounds and wallet"
          : "Original flight. Practice credits."}
      </span>
      <button onClick={() => setModal("help")}>
        <CircleHelp size={13} /> How to play
      </button>
    </div>
  );
}

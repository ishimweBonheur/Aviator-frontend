import { useApp } from "@/store/app.store";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { currency } from "@/utils/format";
import { gameService } from "@/features/game/services/game.service";
export function DemoWallet() {
  const { game, setModal } = useApp();
  return (
    <>
      <p>
        This is a demo wallet. Add free practice credits to explore the game.
      </p>
      <div className="modal-balance">
        <small>AVAILABLE DEMO BALANCE</small>
        <strong>
          {currency(game.balance)} <span>RWF</span>
        </strong>
      </div>
      <button
        className="primary-button"
        onClick={() => {
          gameService.addDemoFunds();
          toast.success("10,000 RWF demo credits added");
          setModal(null);
        }}
      >
        <Plus size={18} /> Add 10,000 demo RWF
      </button>
      <small className="modal-note">
        No payments. No deposits of real money.
      </small>
    </>
  );
}

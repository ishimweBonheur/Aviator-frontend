import { useGameContext } from "@/features/game/state/game.context";
import { GameHelp } from "@/features/game/components/GameHelp";
import { Settings } from "@/features/settings/components/Settings";
import { useCallback } from "react";
import { Wallet, History, Settings2, Users, Plane } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PlayerAccount } from "./components/PlayerAccount";
import { FairnessView } from "@/features/game/components/FairnessView";
import { IntegrationStatus } from "@/features/game/components/IntegrationStatus";
export function GameDialogs() {
  const { game, modal, setModal, sound, reduced, setReduced } =
    useGameContext();
  const close = useCallback(() => setModal(null), [setModal]);
  return (
    <Modal modal={modal} onClose={close}>
      <span className="modal-symbol">
        {modal === "wallet" ? (
          <Wallet />
        ) : modal === "history" ? (
          <History />
        ) : modal === "settings" ? (
          <Settings2 />
        ) : modal === "profile" ? (
          <Users />
        ) : (
          <Plane />
        )}
      </span>
      <h2 id="modal-title">
        {modal === "integration"
          ? "Backend integration"
          : modal === "wallet"
            ? "Fuel your next flight"
            : modal === "history"
              ? "Recent flights"
              : modal === "settings"
                ? "Your cockpit"
                : modal === "profile"
                  ? "Your account"
                  : "Ready for takeoff?"}
      </h2>
      {modal === "integration" && <IntegrationStatus />}
      {(modal === "wallet" || modal === "profile") && (
        <PlayerAccount game={game} wallet={modal === "wallet"} />
      )}

      {modal === "help" && <GameHelp />}
      {modal === "settings" && (
        <Settings
          sound={sound}
          reduced={reduced}
          onReduced={() => setReduced(!reduced)}
          onIntegration={() => setModal("integration")}
        />
      )}

      {modal === "history" && <FairnessView />}
    </Modal>
  );
}

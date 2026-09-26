import { useApp } from "@/store/app.store";
import { DemoWallet } from "@/features/wallet/components/DemoWallet";
import { GameHelp } from "@/features/game/components/GameHelp";
import { Settings } from "@/features/settings/components/Settings";
import { DemoProfile } from "@/features/user/components/DemoProfile";
import { DemoHistory } from "@/features/game/components/DemoHistory";
import { useCallback } from "react";
import { Wallet, History, Settings2, Users, Plane } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { BackendAccount } from "@/features/auth/components/BackendAccount";
import { FairnessView } from "@/features/game/components/FairnessView";
import { IntegrationStatus } from "@/features/game/components/IntegrationStatus";
export function AppDialogs() {
  const { game, backend, modal, setModal } = useApp();
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
                  ? backend
                    ? "Your account"
                    : "Welcome aboard, Jordan"
                  : "Ready for takeoff?"}
      </h2>
      {modal === "integration" && <IntegrationStatus backend={backend} />}
      {backend && (modal === "wallet" || modal === "profile") && (
        <BackendAccount game={game} wallet={modal === "wallet"} />
      )}
      {modal === "wallet" && !backend && <DemoWallet />}
      {modal === "help" && <GameHelp />}
      {modal === "settings" && <Settings />}
      {modal === "profile" && !backend && <DemoProfile />}
      {modal === "history" && backend && <FairnessView />}
      {modal === "history" && !backend && <DemoHistory />}
    </Modal>
  );
}

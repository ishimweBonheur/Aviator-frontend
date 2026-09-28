import { useGameContext } from "@/features/game/state/game.context";
import { CircleHelp } from "lucide-react";
export function GameHeading() {
  const { game, setModal } = useGameContext();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> A LITTLE COURAGE. A LITTLE ALTITUDE.
          </div>
          <h1>
            Catch your next high<span>.</span>
          </h1>
          <p>Place your bet. Watch it climb. Make your move.</p>
        </div>
        <button
          className="connection-badge"
          onClick={() => setModal("integration")}
        >
          <span className="pulse-dot" />{" "}
          {`BACKEND · ${game.connection?.toUpperCase()}`}{" "}
          <CircleHelp size={13} />
        </button>
      </div>
      {
        <div className="connection-banner" role="status">
          <span>
            {game.error ||
              (game.user
                ? `Signed in as ${game.user.username}. Bets are submitted to the backend wallet.`
                : "Backend mode. Sign in to place bets with your server account.")}
          </span>
          <button
            onClick={() => setModal(game.user ? "integration" : "profile")}
          >
            {game.user ? "Integration status" : "Sign in"}
          </button>
        </div>
      }
    </>
  );
}

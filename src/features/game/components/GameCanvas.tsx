import { Aircraft } from "./Aircraft";
import { motion } from "framer-motion";
import { ArrowUpRight, Expand, Radio, ShieldCheck } from "lucide-react";
import type { GameSnapshot } from "@/features/game/types/game.types";

export function GameCanvas({ game }: { game: GameSnapshot }) {
  const { round, countdown } = game;

  const flying = round.status === "FLYING",
    crashed = round.status === "CRASHED";
  const countdownAvailable =
    game.connection === "connected" &&
    ["BETTING", "BETTING_CLOSED"].includes(round.status) &&
    !!game.bettingRound;
  const progress = Math.min(1, Math.log(round.multiplier) / Math.log(9));
  const x = 110 + progress * 635,
    y = 324 - progress * progress * 260;
  const path = `M 42 340 Q ${x * 0.68} 345 ${x} ${y}`;
  return (
    <section
      className={`game-canvas ${crashed ? "crashed" : ""}`}
      aria-label="Live crash game"
    >
      <div className="canvas-top">
        <span className="live-label">
          <Radio size={13} /> LIVE FLIGHT <span className="dim">/</span>{" "}
          <span className="round-id">#{round.roundNumber}</span>
        </span>
        <button
          className="icon-button"
          aria-label="Expand game"
          onClick={() => {
            const el = document.querySelector(".game-canvas");
            if (document.fullscreenElement) void document.exitFullscreen();
            else void el?.requestFullscreen();
          }}
        >
          <Expand size={16} />
        </button>
      </div>
      <div className="orbital orbital-one" />
      <div className="orbital orbital-two" />
      <div className="chart-y">
        <span>10x</span>
        <span>5x</span>
        <span>2x</span>
        <span>1x</span>
      </div>
      <svg
        className="flight-chart"
        viewBox="0 0 850 390"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f94064" stopOpacity=".22" />
            <stop offset="1" stopColor="#f94064" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {flying && (
          <>
            <path d={`${path} L ${x} 350 L 42 350 Z`} fill="url(#area)" />
            <path
              d={path}
              fill="none"
              stroke="#ff3c63"
              strokeWidth="8"
              opacity=".2"
              filter="url(#glow)"
            />
            <path d={path} fill="none" stroke="#ff3c63" strokeWidth="3" />
          </>
        )}
      </svg>
      {flying && (
        <motion.div
          className="aircraft"
          animate={{
            left: `${x / 8.5}%`,
            top: `${y / 3.9}%`,
            opacity: 1,
          }}
          transition={{ duration: 0.07, ease: "linear" }}
        >
          <Aircraft />
        </motion.div>
      )}
      <div className="multiplier-block">
        {flying ? (
          <>
            <div className="flight-caption">YOU’RE CLEARED FOR TAKEOFF</div>
            <div className="multiplier">
              {round.multiplier.toFixed(2)}
              <span>x</span>
            </div>
            <div className="flight-status">
              <span className="pulse-dot" /> Gaining altitude{" "}
              <ArrowUpRight size={15} />
            </div>
          </>
        ) : (
          <>
            <div className="flight-caption">
              {countdownAvailable && countdown > 0
                ? "PLACE YOUR BETS"
                : crashed
                  ? "ROUND CRASHED"
                  : "WAITING FOR NEXT ROUND"}
            </div>
            <div
              className="multiplier countdown"
              role="timer"
              aria-label="Next round countdown"
            >
              {countdownAvailable ? countdown : "—"}
              {countdownAvailable && <span>s</span>}
            </div>

            <div className="flight-status">
              {game.connection !== "connected"
                ? "Connecting to the game server…"
                : countdownAvailable && countdown > 0
                  ? `Next round starts in ${countdown}`
                  : "Waiting for the server to start the flight"}
            </div>
          </>
        )}
      </div>
      {game.history.length > 0 && (
        <div className="previous-round">
          Previous: {game.history[0].toFixed(2)}x
        </div>
      )}
      <div className="canvas-bottom">
        <span>
          <ShieldCheck size={13} />{" "}
          {`SERVER · ${game.connection?.toUpperCase()}`}
        </span>
        <span>
          {flying
            ? "Flight in progress"
            : crashed
              ? "Flight complete"
              : "Waiting for server"}
          <span className={`status-dot ${flying ? "green-bg" : ""}`} />
        </span>
      </div>
    </section>
  );
}

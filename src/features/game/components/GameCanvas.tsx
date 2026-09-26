import { Aircraft } from "./Aircraft";
import { motion } from "framer-motion";
import { ArrowUpRight, Expand, Radio, ShieldCheck } from "lucide-react";
import type { GameSnapshot } from "@/features/game/types/game.types";

export function GameCanvas({ game }: { game: GameSnapshot }) {
  const { round, countdown } = game;
  const backend = game.mode === "backend";
  const flying = round.status === "FLYING",
    crashed = round.status === "CRASHED";
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
        {(flying || crashed) && (
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
      {(flying || crashed) && (
        <motion.div
          className="aircraft"
          animate={{
            left: crashed ? "115%" : `${x / 8.5}%`,
            top: crashed ? "-25%" : `${y / 3.9}%`,
            opacity: crashed ? 0 : 1,
          }}
          transition={{ duration: crashed ? 0.7 : 0.07, ease: "linear" }}
        >
          <Aircraft />
        </motion.div>
      )}
      <div className="multiplier-block">
        {flying || crashed ? (
          <>
            <div className={`flight-caption ${crashed ? "pink" : ""}`}>
              {crashed ? "FLEW AWAY" : "YOU’RE CLEARED FOR TAKEOFF"}
            </div>
            <div className={`multiplier ${crashed ? "pink" : ""}`}>
              {round.multiplier.toFixed(2)}
              <span>x</span>
            </div>
            <div className="flight-status">
              {crashed ? (
                "A new flight is on the horizon"
              ) : (
                <>
                  <span className="pulse-dot" /> Gaining altitude{" "}
                  <ArrowUpRight size={15} />
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flight-caption">WAITING FOR NEXT ROUND</div>
            <div className="multiplier countdown">
              {countdown}
              {<span>s</span>}
            </div>
            {!backend && (
              <div className="countdown-track">
                <div style={{ width: `${(countdown / 6) * 100}%` }} />
              </div>
            )}
            <div className="flight-status">
              {backend
                ? game.connection !== "connected"
                  ? "Connecting to the game server…"
                  : "Waiting for the server to start the flight"
                : "Place your bets. Get ready to fly."}
            </div>
          </>
        )}
      </div>
      <div className="canvas-bottom">
        <span>
          <ShieldCheck size={13} />{" "}
          {backend
            ? `SERVER · ${game.connection?.toUpperCase()}`
            : "FRONTEND SIMULATION"}
        </span>
        <span>
          {flying
            ? "Flight in progress"
            : crashed
              ? "Flight complete"
              : backend
                ? "Waiting for server"
                : "Betting is open"}
          <span className={`status-dot ${flying ? "green-bg" : ""}`} />
        </span>
      </div>
    </section>
  );
}

import { useRef } from "react";
import { motion } from "framer-motion";

import { Aircraft } from "./Aircraft";
import type { GameSnapshot } from "@/features/game/types/game.types";

interface GameCanvasProps {
  game: GameSnapshot;
}

export function GameCanvas({ game }: GameCanvasProps) {
  const canvasRef = useRef<HTMLElement | null>(null);

  const { round, countdown } = game;

  const flying = round.status === "FLYING";
  const crashed = round.status === "CRASHED";

  const countdownAvailable =
    game.connection === "connected" &&
    ["BETTING", "BETTING_CLOSED"].includes(round.status) &&
    Boolean(game.bettingRound);

  const progress = Math.max(
    0,
    Math.min(1, Math.log(Math.max(round.multiplier, 1)) / Math.log(9)),
  );

  const x = 110 + progress * 635;
  const y = 324 - progress * progress * 260;

  const path = `M 42 340 Q ${x * 0.68} 345 ${x} ${y}`;

  return (
    <section
      ref={canvasRef}
      className="
        relative h-92 overflow-hidden
        rounded-b-[11px]
        border border-t-0 border-[#2a2832]
        bg-[radial-gradient(ellipse_at_58%_85%,#521b3327,transparent_60%),#14151b]

        before:absolute
        before:inset-0
        before:animate-drift
        before:bg-[radial-gradient(#8b78813d_0.7px,transparent_0.7px)]
        before:bg-size-[25px_25px]
        before:content-['']
        before:mask-[linear-gradient(transparent,#000_55%,transparent)]

        fullscreen:h-screen

        min-[1440px]:h-105

        max-[900px]:h-95

        max-[600px]:h-80
      "
      aria-label="Live crash game"
    >
      {/* Top controls / information area */}
      <div
        className="
          absolute top-4 right-5 left-5 z-3
          flex items-center justify-between

          max-[600px]:top-2.5
          max-[600px]:right-2.5
          max-[600px]:left-4
        "
      />

      {/* Decorative background circles */}
      <div
        className="
          absolute top-14 left-[calc(50%-315px)]
          h-158 w-158
          rounded-full
          border border-[#b5788a08]
        "
      />

      <div
        className="
          absolute -top-20 left-[calc(50%-450px)]
          h-225 w-225
          rounded-full
          border border-[#b5788a08]
        "
      />

      {/* Multiplier scale */}
      <div
        className="
          absolute top-20 bottom-11 left-4
          flex flex-col justify-between
          text-[8px] text-[#4f4d5d]

          max-[600px]:left-2.5
          max-[600px]:text-[7px]
        "
        aria-hidden="true"
      >
        <span>10x</span>
        <span>5x</span>
        <span>2x</span>
        <span>1x</span>
      </div>

      {/* Flight path */}
      <svg
        className="absolute inset-0 h-full w-full"
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
            {/* Area underneath curve */}
            <path
              d={`${path} L ${x} 350 L 42 350 Z`}
              fill="url(#area)"
            />

            {/* Glow */}
            <path
              d={path}
              fill="none"
              stroke="#ff3c63"
              strokeWidth="8"
              opacity=".2"
              filter="url(#glow)"
            />

            {/* Main curve */}
            <path
              d={path}
              fill="none"
              stroke="#ff3c63"
              strokeWidth="3"
            />
          </>
        )}
      </svg>

      {/* Aircraft */}
      {flying && (
        <motion.div
          className="
            pointer-events-none absolute z-2
            -mt-8 -ml-7
            w-22.75
            drop-shadow-[0_6px_18px_#f3315755]

            max-[600px]:-mt-5.5
            max-[600px]:-ml-5.75
            max-[600px]:w-16.75
          "
          animate={{
            left: `${x / 8.5}%`,
            top: `${y / 3.9}%`,
            opacity: 1,
          }}
          transition={{
            duration: 0.07,
            ease: "linear",
          }}
        >
          <Aircraft />
        </motion.div>
      )}

      {/* Center game information */}
      <div
        className="
          pointer-events-none absolute
          top-19.5 right-0 left-0
          text-center

          min-[1440px]:top-24.25

          max-[600px]:top-21.75
        "
      >
        {flying ? (
          <>
            {/* Flying status */}
            <div
              className="
                text-[8px]
                tracking-[2.6px]
                text-[#a2a0ad]

                min-[1440px]:text-[9px]

                max-[600px]:text-[6px]
                max-[600px]:tracking-[2px]
              "
            >
              YOU&apos;RE CLEARED FOR TAKEOFF
            </div>

            {/* Current multiplier */}
            <div
              className="
                mt-0.75
                text-[86px]
                leading-[1.2]
                font-[750]
                tracking-[-5px]
                tabular-nums
                text-shadow-[0_4px_30px_#fff1]

                min-[1440px]:text-[101px]

                max-[600px]:text-[70px]
                max-[600px]:tracking-[-3px]
              "
              aria-live="off"
            >
              {round.multiplier.toFixed(2)}

              <span
                className="
                  ml-1
                  text-[0.65em]
                  font-[550]
                  tracking-[-3px]
                "
              >
                x
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Round state */}
            <div
              className="
                text-[8px]
                tracking-[2.6px]
                text-[#a2a0ad]

                min-[1440px]:text-[9px]

                max-[600px]:text-[6px]
                max-[600px]:tracking-[2px]
              "
            >
              {countdownAvailable && countdown > 0
                ? "PLACE YOUR BETS"
                : crashed
                  ? "ROUND CRASHED"
                  : "WAITING FOR NEXT ROUND"}
            </div>

            {/* Countdown */}
            <div
              className="
                mt-1
                text-[75px]
                leading-[1.2]
                font-[750]
                tracking-[-5px]
                tabular-nums
                text-shadow-[0_4px_30px_#fff1]

                min-[1440px]:text-[101px]

                max-[600px]:text-[70px]
                max-[600px]:tracking-[-3px]
              "
              role="timer"
              aria-label="Next round countdown"
              aria-live="polite"
            >
              {countdownAvailable ? countdown : "—"}

              {countdownAvailable && (
                <span
                  className="
                    ml-1
                    text-[0.65em]
                    font-[550]
                    tracking-[-3px]
                  "
                >
                  s
                </span>
              )}
            </div>

            {/* Server / round information */}
            <div
              className="
                mt-2
                flex items-center justify-center
                gap-1.5
                text-[10px]
                text-[#aaa4b2]

                min-[1440px]:text-[11px]

                max-[600px]:text-[9px]
              "
            >
              {game.connection !== "connected"
                ? "Connecting to the game server…"
                : countdownAvailable && countdown > 0
                  ? `Next round starts in ${countdown}`
                  : "Waiting for the server to start the flight"}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
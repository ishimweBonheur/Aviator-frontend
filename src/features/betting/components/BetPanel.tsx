import { motion } from "framer-motion";
import { ArrowUpRight, Check, Minus, Plus, Zap } from "lucide-react";

import { Toggle } from "@/components/ui/Toggle";
import { useBet } from "@/features/betting/hooks/useBet";
import { QUICK_BET_AMOUNTS } from "@/features/betting/betting.constants";
import type { GameSnapshot } from "@/features/game/types/game.types";
import { currency } from "@/utils/format";

interface BetPanelProps {
  panel: number;
  game: GameSnapshot;
}

export function BetPanel({ panel, game }: BetPanelProps) {
  const {
    mode,
    setMode,
    settings,
    busy,
    bet,
    open,
    locked,
    configure,
    action,
    label,
    finished,
  } = useBet(panel, game);

  const minBet = Number(game.limits?.MinBet ?? 50);
  const maxBet = Number(game.limits?.MaxBet ?? 1_000_000);

  const actionTone =
    bet?.status === "ACTIVE"
      ? `
        bg-[linear-gradient(120deg,#29a576,#1c805c)]
        shadow-[0_5px_16px_rgba(41,165,118,0.22)]
      `
      : bet?.status === "PENDING"
        ? `
          bg-[#39303b]
          shadow-[0_4px_14px_rgba(0,0,0,0.22)]
        `
        : bet?.status === "LOST"
          ? `
            bg-[#35272e]
            shadow-[0_4px_14px_rgba(0,0,0,0.22)]
          `
          : `
            bg-[linear-gradient(125deg,#f54a6b,#ee3459)]
            shadow-[0_4px_16px_#f3395917]
          `;

  const actionDisabled =
    busy ||
    bet?.status === "UNKNOWN" ||
    game.connection !== "connected" ||
    (bet?.status === "PENDING" && (!open || !bet.canCancel)) ||
    (bet?.status === "ACTIVE" &&
      (game.round.status !== "FLYING" || !bet.canCashout)) ||
    bet?.status === "CASHED_OUT" ||
    bet?.status === "LOST" ||
    bet?.status === "CANCELLED" ||
    (!bet && !open);

  const decreaseAmount = () => {
    configure({
      amount: Math.max(minBet, settings.amount - 100),
    });
  };

  const increaseAmount = () => {
    configure({
      amount: Math.min(maxBet, settings.amount + 100),
    });
  };

  return (
    <section
      className="
        rounded-[11px]
        bg-[linear-gradient(115deg,#202127,#1b1c22)]
        p-3.75
        shadow-[0_10px_28px_rgba(0,0,0,0.22)]

        min-[1440px]:p-4.75

        max-[1100px]:p-3

        max-[900px]:p-4.5

        max-[600px]:p-4

        max-[359px]:p-3.25
      "
    >
      {/* Header */}
      <div
        className="
          mb-4.25
          flex items-center
          justify-between
          gap-2

          min-[1440px]:mb-5

          max-[600px]:mb-3.5
        "
      >
        <span
          className="
            flex items-center
            gap-1.75
            text-[8px]
            font-semibold
            tracking-[1.2px]
            text-[#a3a1af]

            max-[1100px]:text-[7px]
            max-[1100px]:tracking-[0.5px]

            max-[900px]:text-[9px]

            max-[600px]:text-[8px]
          "
        >
          <span
            className="
              grid size-5.25
              place-items-center
              rounded-[5px]
              bg-[#323039]
              text-[9px]
              tracking-normal
              text-[#c6c1ce]
              shadow-[0_2px_7px_rgba(0,0,0,0.25)]
            "
          >
            0{panel + 1}
          </span>
          BET PANEL
        </span>

        {/* Manual / Auto */}
        <div
          className="
            flex gap-0.5
            rounded-md
            bg-[#14151b]
            p-0.75
            shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)]
          "
        >
          <button
            type="button"
            className={`
              flex items-center
              gap-1
              rounded
              px-2.5
              py-1.25
              text-[9px]
              transition-all duration-150

              max-[1100px]:px-1.5
              max-[1100px]:py-1

              max-[900px]:px-2.5
              max-[900px]:py-1.25
              max-[900px]:text-[10px]

              ${
                mode === "manual"
                  ? `
                    bg-[#33313b]
                    text-[#e8e6ed]
                    shadow-[0_2px_3px_#0003]
                  `
                  : `
                    bg-transparent
                    text-[#84818e]
                  `
              }
            `}
            onClick={() => {
              setMode("manual");
              configure({ enabled: false });
            }}
          >
            Manual
          </button>

          <button
            type="button"
            className={`
              flex items-center
              gap-1
              rounded
              px-2.5
              py-1.25
              text-[9px]
              transition-all duration-150

              max-[1100px]:px-1.5
              max-[1100px]:py-1

              max-[900px]:px-2.5
              max-[900px]:py-1.25
              max-[900px]:text-[10px]

              ${
                mode === "auto"
                  ? `
                    bg-[#33313b]
                    text-[#e8e6ed]
                    shadow-[0_2px_3px_#0003]
                  `
                  : `
                    bg-transparent
                    text-[#84818e]
                  `
              }
            `}
            onClick={() => setMode("auto")}
          >
            <Zap size={12} />
            Auto
          </button>
        </div>
      </div>

      {/* Main betting section */}
      <div
        className="
          grid grid-cols-[1.1fr_1fr]
          gap-3

          min-[1440px]:gap-3.75

          max-[1100px]:gap-2

          max-[900px]:gap-3.75

          max-[600px]:grid-cols-2
          max-[600px]:gap-3.75
        "
      >
        {/* Bet amount */}
        <div>
          <label
            className="
              mb-1.75
              flex justify-between
              text-[9px]
              text-[#898693]
            "
            htmlFor={`amount-${panel}`}
          >
            Bet amount
            <span className="text-[8px] text-[#615e6c]">RWF</span>
          </label>

          <div
            className="
              flex h-9
              items-center
              rounded-md
              bg-[#14151a]
              p-1
              shadow-[inset_0_2px_5px_rgba(0,0,0,0.32)]

              max-[600px]:h-10
            "
          >
            <button
              type="button"
              className="
                grid size-6.25
                shrink-0
                place-items-center
                rounded
                bg-[#28272f]
                text-[#b4aebe]
                shadow-[0_2px_5px_rgba(0,0,0,0.25)]
                transition-all duration-150

                hover:brightness-110
                active:scale-95

                disabled:cursor-not-allowed
                disabled:opacity-50

                max-[600px]:size-7.25
              "
              aria-label={`Decrease bet ${panel + 1}`}
              disabled={locked}
              onClick={decreaseAmount}
            >
              <Minus size={15} />
            </button>

            <input
              id={`amount-${panel}`}
              className="
                w-full
                bg-transparent
                px-0.75
                text-center
                text-[15px]
                font-semibold
                text-[#e5e2eb]
                outline-none

                disabled:cursor-not-allowed
                disabled:opacity-60

                max-[600px]:text-[17px]
              "
              type="number"
              min={minBet}
              max={maxBet}
              step="0.01"
              value={settings.amount}
              disabled={locked}
              onChange={(event) =>
                configure({
                  amount: Number(event.target.value),
                })
              }
            />

            <button
              type="button"
              className="
                grid size-6.25
                shrink-0
                place-items-center
                rounded
                bg-[#28272f]
                text-[#b4aebe]
                shadow-[0_2px_5px_rgba(0,0,0,0.25)]
                transition-all duration-150

                hover:brightness-110
                active:scale-95

                disabled:cursor-not-allowed
                disabled:opacity-50

                max-[600px]:size-7.25
              "
              aria-label={`Increase bet ${panel + 1}`}
              disabled={locked}
              onClick={increaseAmount}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Quick bet amounts */}
          <div className="mt-1.5 flex gap-1">
            {QUICK_BET_AMOUNTS.map((amount) => (
              <button
                type="button"
                key={amount}
                className="
                  h-5.75
                  flex-1
                  rounded
                  bg-[#292830]
                  px-0.5
                  text-[8px]
                  text-[#a8a1b2]
                  shadow-[0_2px_5px_rgba(0,0,0,0.18)]
                  transition-all duration-150

                  hover:brightness-110

                  active:scale-[0.97]

                  disabled:cursor-not-allowed
                  disabled:opacity-50

                  max-[600px]:h-6.75
                  max-[600px]:text-[9px]
                "
                disabled={locked}
                onClick={() => configure({ amount })}
              >
                {currency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Main BET / CASH OUT button */}
        <motion.button
          type="button"
          whileTap={
            actionDisabled
              ? undefined
              : {
                  scale: 0.97,
                }
          }
          className={`
            flex flex-col
            items-center
            justify-center
            gap-1.5
            rounded-[7px]
            transition-all duration-150

            disabled:cursor-not-allowed
            disabled:opacity-70

            min-[1440px]:min-h-23.75

            max-[900px]:min-h-21.75

            max-[600px]:min-h-25

            ${actionTone}
          `}
          aria-busy={busy}
          disabled={actionDisabled}
          onClick={action}
        >
          <span
            className="
              flex items-center
              gap-2
              text-[13px]
              font-semibold

              max-[1100px]:text-[11px]

              max-[900px]:text-sm

              max-[600px]:text-[15px]
            "
          >
            {label}

            {!busy &&
              (bet?.status === "CASHED_OUT" ? (
                <Check size={18} />
              ) : (
                <ArrowUpRight size={19} />
              ))}
          </span>

          {bet?.status === "ACTIVE" && (
            <strong
              className="
              text-[17px]
              font-[650]
              tabular-nums

              max-[1100px]:text-sm

              max-[900px]:text-lg

              max-[600px]:text-xl
            "
            >
              {currency(
                bet?.status === "ACTIVE" || bet?.status === "CASHED_OUT"
                  ? bet.potentialWin
                  : settings.amount,
              )}{" "}
              <small
                className="
                text-[9px]
                font-medium
                text-[#ffe2e8]
              "
              >
                RWF
              </small>
            </strong>
          )}
        </motion.button>
      </div>

      {/* Auto Bet message */}
      {settings.enabled && (
        <p
          className="
            mt-2.5
            text-[10px]
            leading-[1.6]
            text-[#a69bad]
          "
        ></p>
      )}

      {/* Error */}
      {settings.error && (
        <p
          role="alert"
          className="
            mt-2.5
            text-[10px]
            leading-[1.6]
            text-[#a69bad]
          "
        >
          {settings.error}
        </p>
      )}

      {/* Bottom controls */}
      <div
        className="
          mt-3.75
          flex min-h-7.5
          items-center
          gap-2.5
          pt-3.25

          max-[1100px]:gap-1.25

          max-[600px]:mt-3.25
          max-[600px]:pt-3
        "
      >
        {mode === "auto" && (
          <label
            className="
              flex items-center
              gap-1.5
              text-[9px]
              whitespace-nowrap
              text-[#95909f]

              max-[1100px]:text-[8px]

              max-[900px]:text-[10px]

              max-[359px]:text-[9px]
            "
          >
            <Toggle
              checked={settings.enabled}
              onChange={() =>
                configure({
                  enabled: !settings.enabled,
                })
              }
              label={`Auto bet panel ${panel + 1}`}
            />
            Auto bet
          </label>
        )}

        <label
          className="
            flex items-center
            gap-1.5
            text-[9px]
            whitespace-nowrap
            text-[#95909f]

            max-[1100px]:text-[8px]

            max-[900px]:text-[10px]

            max-[359px]:text-[9px]
          "
        >
          <Toggle
            disabled={locked}
            checked={settings.cashOut}
            onChange={() =>
              configure({
                cashOut: !settings.cashOut,
              })
            }
            label={`Auto cash out panel ${panel + 1}`}
          />
          Auto cash out
        </label>

        {/* Auto cash-out multiplier */}
        <div
          className="
            ml-auto
            flex items-center
            gap-0.75
            rounded
            bg-[#18181e]
            px-1.75
            py-1
            text-[10px]
            text-[#716b7a]
            shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)]
          "
        >
          <input
            className="
              w-9.75
              bg-transparent
              text-center
              text-[10px]
              text-[#c2b9cd]
              outline-none

              disabled:cursor-not-allowed
              disabled:opacity-50

              max-[600px]:w-11
              max-[600px]:text-[11px]
            "
            aria-label={`Auto cash out multiplier ${panel + 1}`}
            type="number"
            min="1.01"
            max="1000000"
            step="0.01"
            disabled={locked}
            value={settings.target}
            onChange={(event) =>
              configure({
                target: Number(event.target.value),
              })
            }
          />

          <span>×</span>
        </div>
      </div>

      {finished && (
        <p role="status" className="mt-2.5 text-[10px] text-[#a69bad]">
          {finished}
        </p>
      )}
      {/* Status */}
      <p
        className="
          mt-2.5
          text-[10px]
          leading-[1.6]
          text-[#a69bad]
        "
      ></p>
    </section>
  );
}

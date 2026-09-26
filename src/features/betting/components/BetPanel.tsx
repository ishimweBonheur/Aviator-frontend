import { Toggle } from "@/components/ui/Toggle";
import { useBet } from "@/features/betting/hooks/useBet";
import { QUICK_BET_AMOUNTS } from "@/constants/betting.constants";
import { ArrowUpRight, Check, Minus, Plus, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { GameSnapshot } from "@/features/game/types/game.types";

import { currency } from "@/utils/format";
export function BetPanel({
  panel,
  game,
}: {
  panel: number;
  game: GameSnapshot;
}) {
  const {
    mode,
    setMode,
    settings,
    backend,
    busy,
    bet,
    open,
    locked,
    configure,
    action,
    label,
  } = useBet(panel, game);
  return (
    <section className="bet-panel">
      <div className="bet-panel-header">
        <span className="bet-label">
          <span className="panel-number">0{panel + 1}</span> BET PANEL
        </span>
        <div className="segmented">
          <button
            className={mode === "manual" ? "selected" : ""}
            onClick={() => setMode("manual")}
          >
            Manual
          </button>
          <button
            disabled={backend}
            title={
              backend
                ? "Automatic betting requires additional backend support"
                : undefined
            }
            className={mode === "auto" ? "selected" : ""}
            onClick={() => setMode("auto")}
          >
            <Zap size={12} /> Auto
          </button>
        </div>
      </div>
      <div className="bet-main">
        <div className="amount-section">
          <label htmlFor={`amount-${panel}`}>
            Bet amount <span>RWF</span>
          </label>
          <div className="amount-input">
            <button
              aria-label={`Decrease bet ${panel + 1}`}
              disabled={locked}
              onClick={() =>
                configure({
                  amount: Math.max(backend ? 50 : 100, settings.amount - 100),
                })
              }
            >
              <Minus size={15} />
            </button>
            <input
              id={`amount-${panel}`}
              type="number"
              min={backend ? Number(game.limits?.MinBet ?? 50) : 100}
              max={Number(game.limits?.MaxBet ?? 1000000)}
              step={backend ? "0.01" : "100"}
              value={settings.amount}
              disabled={locked}
              onChange={(e) => configure({ amount: Number(e.target.value) })}
            />
            <button
              aria-label={`Increase bet ${panel + 1}`}
              disabled={locked}
              onClick={() =>
                configure({ amount: Math.min(1000000, settings.amount + 100) })
              }
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="quick-amounts">
            {QUICK_BET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                disabled={locked}
                onClick={() => configure({ amount })}
              >
                {currency(amount)}
              </button>
            ))}
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className={`bet-action ${bet?.status === "ACTIVE" ? "cashout" : ""} ${bet?.status === "PENDING" ? "pending" : ""} ${bet?.status === "LOST" ? "lost" : ""}`}
          disabled={
            busy ||
            bet?.status === "UNKNOWN" ||
            (backend &&
              (game.connection !== "connected" ||
                (bet?.status === "PENDING" && !open))) ||
            bet?.status === "CASHED_OUT" ||
            bet?.status === "LOST" ||
            bet?.status === "CANCELLED" ||
            (!bet && !open)
          }
          onClick={action}
        >
          <span>
            {label}
            {bet?.status === "CASHED_OUT" ? (
              <Check size={18} />
            ) : (
              <ArrowUpRight size={19} />
            )}
          </span>
          <strong>
            {currency(
              bet?.status === "ACTIVE" || bet?.status === "CASHED_OUT"
                ? bet.potentialWin
                : settings.amount,
            )}{" "}
            <small>RWF</small>
          </strong>
          {!bet && !open && <small>Waiting for takeoff</small>}
        </motion.button>
      </div>
      <div className="auto-row">
        {mode === "auto" && (
          <label>
            <Toggle
              checked={settings.enabled}
              onChange={() => configure({ enabled: !settings.enabled })}
              label={`Auto bet panel ${panel + 1}`}
            />{" "}
            Auto bet
          </label>
        )}
        <label>
          <Toggle
            disabled={backend || locked}
            checked={settings.cashOut}
            onChange={() => configure({ cashOut: !settings.cashOut })}
            label={`Auto cash out panel ${panel + 1}`}
          />{" "}
          Auto cash out
        </label>
        <div className="target-input">
          <input
            aria-label={`Auto cash out multiplier ${panel + 1}`}
            type="number"
            min="1.01"
            max="100"
            step="0.1"
            disabled={locked || backend}
            value={settings.target}
            onChange={(e) => configure({ target: Number(e.target.value) })}
          />
          <span>×</span>
        </div>
      </div>
      {backend && (
        <p className="panel-note">
          {game.bettingRound && (
            <span>
              Upcoming #{game.bettingRound.roundNumber}:{" "}
              {game.countdown > 0
                ? `${game.countdown}s to bet`
                : "betting closed"}
              .{" "}
            </span>
          )}
          {game.limits && (
            <span>
              Maximum payout: {currency(Number(game.limits.MaxPayout))}{" "}
              RWF.{" "}
            </span>
          )}
          {bet?.status === "UNKNOWN"
            ? "Response unconfirmed. Bet lookup is needed to reconcile this result."
            : bet?.status === "PENDING"
              ? `Queued for round #${bet.roundNumber}. Cancel before betting closes.`
              : "Auto cash-out is not available on the backend yet."}
        </p>
      )}
    </section>
  );
}

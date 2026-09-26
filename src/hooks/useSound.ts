import { useEffect, useRef, useState } from "react";
import type { GameStatus } from "@/features/game/types/game.types";

export function useSound(status: GameStatus, cashOutCount: number) {
  const [enabled, setEnabled] = useState(false);
  const context = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (!enabled || !context.current) return;
    const ctx = context.current;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(
      status === "CRASHED" ? 180 : 520,
      ctx.currentTime,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      status === "CRASHED" ? 60 : 800,
      ctx.currentTime + 0.2,
    );
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
  }, [status, enabled, cashOutCount]);
  return {
    enabled,
    toggle: () => {
      if (!context.current) context.current = new AudioContext();
      void context.current.resume();
      setEnabled((v) => !v);
    },
  };
}

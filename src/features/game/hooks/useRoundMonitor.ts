import { useEffect, useRef, useState } from "react";
import { createGameSocket } from "@/services/socket";
import type { RoundEvent } from "../types/round-event.types";
interface Monitor {
  connected: boolean;
  roundId: number;
  roundNumber: number;
  status: string;
  multiplier?: string;
  seconds?: number;
}
const initial: Monitor = {
  connected: false,
  roundId: 0,
  roundNumber: 0,
  status: "WAITING",
};
// Read-only subscription: no account data, wallet polling, betting operations or game notifications.
export function useRoundMonitor(confirmed?: {
  id: number;
  roundNumber: number;
  status: string;
}) {
  const [state, setState] = useState<Monitor>(() =>
    confirmed
      ? {
          ...initial,
          roundId: confirmed.id,
          roundNumber: confirmed.roundNumber,
          status: confirmed.status,
        }
      : initial,
  );
  const confirmedRef = useRef(confirmed);
  useEffect(() => {
    confirmedRef.current = confirmed;
  }, [confirmed]);
  useEffect(() => {
    let active = true;
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (!active) return;
      socket = createGameSocket();
      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as RoundEvent;
          if (
            !Number.isSafeInteger(event.round_id) ||
            !Number.isSafeInteger(event.round_number)
          )
            return;
          setState((previous) => {
            if (
              event.round_id < previous.roundId ||
              event.type.startsWith("BET_")
            )
              return previous;
            const base = {
              connected: true,
              roundId: event.round_id,
              roundNumber: event.round_number,
            };
            switch (event.type) {
              case "ROUND_OPENED":
              case "COUNTDOWN":
                if (
                  event.round_id === previous.roundId &&
                  ["RUNNING", "CRASHED", "SETTLED"].includes(previous.status)
                )
                  return previous;
                return {
                  ...base,
                  status:
                    (event.seconds_remaining ?? 0) > 0
                      ? "BETTING_OPEN"
                      : "BETTING_CLOSED",
                  seconds: event.seconds_remaining ?? 0,
                };
              case "ROUND_STARTED":
                if (
                  event.round_id === previous.roundId &&
                  ["CRASHED", "SETTLED"].includes(previous.status)
                )
                  return previous;
                return { ...base, status: "RUNNING", multiplier: "1.00" };
              case "MULTIPLIER_UPDATE":
                if (
                  !Number.isFinite(Number(event.multiplier)) ||
                  Number(event.multiplier) < 1
                )
                  return previous;
                if (
                  event.round_id > previous.roundId &&
                  confirmedRef.current?.id === event.round_id &&
                  confirmedRef.current.status === "RUNNING"
                )
                  return {
                    ...base,
                    status: "RUNNING",
                    multiplier: event.multiplier,
                  };
                if (
                  previous.roundId !== event.round_id ||
                  previous.status !== "RUNNING"
                )
                  return previous;
                return {
                  ...previous,
                  connected: true,
                  multiplier: event.multiplier,
                };
              case "ROUND_CRASHED":
                return { ...base, status: "CRASHED" };
              case "ROUND_SETTLED":
                return { ...base, status: "SETTLED" };
              default:
                return previous;
            }
          });
        } catch {
          /* Ignore malformed messages; REST monitoring remains available. */
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (active) {
          setState((previous) => ({ ...previous, connected: false }));
          retry = setTimeout(connect, 2000);
        }
      };
    };
    connect();
    return () => {
      active = false;
      clearTimeout(retry);
      socket?.close();
    };
  }, []);
  return state;
}

import { API_BASE_URL } from "@/constants/config";
export function websocketUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const url = new URL("/ws", API_BASE_URL || window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

// The backend game service owns connection lifecycle and reconnection.
export function createGameSocket() {
  return new WebSocket(websocketUrl());
}

import { request } from "@/services/api";
import type { ApiRound } from "@/features/game/types/game-api.types";
export const gameApi = {
  rounds: () => request<ApiRound[]>("/api/game/rounds"),
  fairness: (id: number) =>
    request<ApiRound>("/api/game/rounds/" + id + "/fairness"),
  limits: () =>
    request<{ MinBet: string; MaxBet: string; MaxPayout: string }>(
      "/api/limits",
    ),
  currentRound: () =>
    request<{
      running: ApiRound | null;
      upcoming: ApiRound | null;
      current_multiplier?: string;
      server_time: string;
      seconds_remaining: number;
      phase: ApiRound["status"] | "WAITING";
    }>("/api/game/rounds/current"),
  verify: (id: number) =>
    request<{ verified: boolean; message: string }>(
      `/api/game/rounds/${id}/verify`,
    ),
  round: (id: number) => request<ApiRound>(`/api/game/rounds/${id}`),
};

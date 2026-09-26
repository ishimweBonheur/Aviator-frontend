import { request } from "@/services/api";
import type { ApiRound } from "@/types/api.types";
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
    }>("/api/game/rounds/current"),
  round: (id: number) => request<ApiRound>(`/api/game/rounds/${id}`),
};

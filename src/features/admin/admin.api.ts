import { gameService } from "@/features/game/services/game.service";

export type Row = Record<string, unknown>;
export interface Page {
  items: Row[];
  page: number;
  page_size: number;
  total: number;
}
export interface Analytics extends Row {
  daily: Row[];
}
export async function adminRequest<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  if (!gameService.accountRequest)
    throw new Error("Switch to backend mode to use administration.");
  return gameService.accountRequest<T>(`/api/admin/${path}`, body, method);
}

import { authenticatedRequest } from "@/features/auth/services/session";
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
export function adminRequest<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  return authenticatedRequest<T>(`/api/admin/${path}`, body, method);
}

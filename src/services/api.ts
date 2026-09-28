import { API_BASE_URL } from "@/constants/config";
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export function isAuthorizationError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null || !("status" in error))
    return false;
  return error.status === 401 || error.status === 403;
}
export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Backend unavailable or request timed out. Check your connection.",
      0,
    );
  }
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : text.trim();
    throw new ApiError(
      message || `Request failed (${response.status})`,
      response.status,
    );
  }
  if (data === undefined)
    throw new ApiError("Backend returned an invalid JSON response.", 0);
  return data as T;
}

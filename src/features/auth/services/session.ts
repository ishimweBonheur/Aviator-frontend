import { ApiError, request } from "@/services/api";
import { authApi } from "./auth.api";
export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role?: "PLAYER" | "ADMIN";
}
interface Session {
  user?: SessionUser;
  error?: string;
  revision: number;
}
const SESSION_KEY = "altitude-backend-session";
class SessionService {
  private token = "";
  private state: Session = { revision: 0 };
  private listeners = new Set<() => void>();
  constructor() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
      if (
        typeof saved?.token === "string" &&
        typeof saved?.user?.id === "number"
      ) {
        this.token = saved.token;
        this.state = { user: saved.user, revision: 0 };
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
  getSnapshot = () => this.state;
  getToken = () => this.token;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(user?: SessionUser, error?: string) {
    this.state = { user, error, revision: this.state.revision + 1 };
    if (user && this.token)
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token: this.token, user }),
      );
    else sessionStorage.removeItem(SESSION_KEY);
    this.listeners.forEach((listener) => listener());
  }
  login = async (email: string, password: string) => {
    const revision = this.state.revision;
    const result = await authApi.login(email, password);
    if (revision !== this.state.revision)
      throw new Error("Session changed. Sign in again.");
    if (!result.token || !result.user?.ID)
      throw new Error("Invalid login response");
    this.token = result.token;
    this.publish({
      id: result.user.ID,
      username: result.user.Username,
      email: result.user.Email,
      role: result.user.Role,
    });
  };
  register = authApi.register;
  logout = () => {
    this.token = "";
    this.publish();
  };
  expire = () => {
    this.token = "";
    this.publish(undefined, "Your session expired. Sign in again.");
  };
  request = async <T>(
    path: string,
    body?: unknown,
    method?: string,
  ): Promise<T> => {
    if (!this.token) throw new ApiError("Sign in to continue.", 401);
    const revision = this.state.revision;
    try {
      const result = await request<T>(path, {
        token: this.token,
        body,
        method: method ?? (body === undefined ? "GET" : "POST"),
      });
      if (revision !== this.state.revision)
        throw new ApiError("Session changed. Please retry.", 401);
      return result;
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        revision === this.state.revision
      )
        this.expire();
      throw error;
    }
  };
}
export const session = new SessionService();
export const authenticatedRequest = session.request;

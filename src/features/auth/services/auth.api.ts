import { request } from "@/services/api";
import type { ApiUser } from "@/features/auth/types/auth.types";
export const authApi = {
  register: (username: string, email: string, password: string) =>
    request<{ user: ApiUser }>("/api/auth/register", {
      method: "POST",
      body: { username, email, password },
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),
};

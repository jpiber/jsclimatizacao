import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { SessionUser } from "@/lib/types";

// The session rides an httpOnly cookie set by /api/auth/login; the frontend only
// ever asks "who am I" and invalidates this query at session boundaries.
export const SESSION_QUERY_KEY = ["session"] as const;

export const fetchSessionUser = () => apiGet<SessionUser>("/auth/me");

// Call after a successful login so every "session" observer refetches.
export async function beginSession() {
  await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}

// Single sign-out path: clears the server cookie AND the react-query cache, so the
// next login on this browser cannot render the previous account's data.
export async function endSession() {
  try {
    await apiPost("/auth/logout");
  } finally {
    queryClient.clear();
  }
}

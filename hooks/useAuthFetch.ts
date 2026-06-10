import { useAuth } from "@clerk/expo";
import { useCallback } from "react";

export const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export function useAuthFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async (path: string, opts: RequestInit = {}): Promise<Response> => {
      const token = await getToken();
      return global.fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opts.headers as Record<string, string> | undefined),
        },
      });
    },
    [getToken],
  );
}

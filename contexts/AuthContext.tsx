import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/expo";
import { API_BASE } from "@/hooks/useAuthFetch";

export interface User {
  id: string;
  name: string;
  identifier: string;
  avatar?: string;
}

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuth();

  const clerkUser = isLoaded && user ? user : null;

  return {
    user: clerkUser
      ? ({
          id: clerkUser.id,
          name: (clerkUser.unsafeMetadata?.displayName as string) || clerkUser.firstName || "",
          identifier: clerkUser.emailAddresses[0]?.emailAddress || "",
          avatar: (clerkUser.unsafeMetadata?.avatarEmoji as string) || undefined,
        } satisfies User)
      : null,

    isLoading: !isLoaded,

    pendingIdentifier: null as string | null,

    requestOTP: async (_identifier: string) => {},

    verifyOTP: async (_code: string): Promise<boolean> => false,

    setupProfile: async (name: string, emoji?: string) => {
      if (!user) return;
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          displayName: name.trim(),
          avatarEmoji: emoji || "👤",
        },
      });
    },

    updateProfile: async (updates: Partial<Pick<User, "name" | "avatar">>) => {
      if (!user) return;
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          ...(updates.name !== undefined ? { displayName: updates.name.trim() } : {}),
          ...(updates.avatar !== undefined ? { avatarEmoji: updates.avatar } : {}),
        },
      });
    },

    logout: async () => {
      await signOut();
      // Navigation is handled by the (tabs)/_layout.tsx auth guard —
      // it watches isSignedIn and replaces to /auth/welcome automatically.
      // Calling router.replace here too creates a double-navigation race
      // condition that silently fails on native.
    },

    deleteAccount: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to delete account.");
      }
      await signOut();
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

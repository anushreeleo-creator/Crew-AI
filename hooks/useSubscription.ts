import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "./useChat";
import { useAuthFetch } from "./useAuthFetch";

export interface SubscriptionStatus {
  groupId: string;
  isPremium: boolean;
  plan: "free" | "premium";
  used: number;
  limit: number;
  remaining: number;
  subscription: {
    status: string;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    productName: string | null;
  } | null;
}

export interface PlanPrice {
  priceId: string;
  productName: string;
  unitAmount: number | null;
  currency: string;
  interval: string;
}

export interface Plan {
  key: string;
  label: string;
  price: number;
  aiActionsPerDay: number;
  features: string[];
  stripePrices: PlanPrice[];
}

export function useSubscription(groupId: string | null) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const authFetch = useAuthFetch();

  const fetchStatus = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/billing/status/${groupId}`);
      if (res.ok) {
        const data = await res.json() as SubscriptionStatus;
        setStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/billing/plans`);
      if (res.ok) {
        const data = await res.json() as { plans: Plan[] };
        setPlans(data.plans);
      }
    } catch {
      // ignore
    }
  }, []);

  const createCheckout = useCallback(async (priceId: string): Promise<string | null> => {
    if (!groupId) return null;
    try {
      const res = await authFetch("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ groupId, priceId }),
      });
      if (res.ok) {
        const data = await res.json() as { url: string };
        return data.url;
      }
    } catch {
      // ignore
    }
    return null;
  }, [groupId, authFetch]);

  const openPortal = useCallback(async (): Promise<string | null> => {
    if (!groupId) return null;
    try {
      const res = await authFetch("/billing/portal", {
        method: "POST",
        body: JSON.stringify({ groupId }),
      });
      if (res.ok) {
        const data = await res.json() as { url: string };
        return data.url;
      }
    } catch {
      // ignore
    }
    return null;
  }, [groupId, authFetch]);

  useEffect(() => {
    fetchStatus();
    fetchPlans();
  }, [fetchStatus, fetchPlans]);

  return {
    status,
    plans,
    loading,
    refresh: fetchStatus,
    createCheckout,
    openPortal,
  };
}

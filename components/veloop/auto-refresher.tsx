"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight near-real-time updates: re-runs the server component tree
 * on an interval. Used on live ride screens (demo has no websockets).
 */
export function AutoRefresher({ intervalMs = 4000, enabled = true }: { intervalMs?: number; enabled?: boolean }) {
  const router = useRouter();
  React.useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, enabled]);
  return null;
}

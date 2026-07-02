"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";

interface RealtimeRefresherProps {
  rideId: string;
  driverId?: string | null;
  enabled?: boolean;
  /** Fallback/backup polling interval. */
  intervalMs?: number;
}

/**
 * Live updates for a ride screen. With Supabase configured it subscribes to
 * postgres_changes on the ride row and the driver's position (RLS applies),
 * refreshing the server tree on each event. A slow polling loop remains as a
 * safety net; in demo mode polling is the only mechanism.
 */
export function RealtimeRefresher({ rideId, driverId, enabled = true, intervalMs = 4000 }: RealtimeRefresherProps) {
  const router = useRouter();

  React.useEffect(() => {
    if (!enabled) return;

    let cleanup: (() => void) | undefined;
    let pollMs = intervalMs;

    if (config.supabase.enabled) {
      pollMs = 20000; // realtime does the work; polling is only a safety net
      let cancelled = false;
      void (async () => {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
        if (cancelled) return;
        const sb = getSupabaseBrowserClient();
        // Throttle refreshes: several events in a burst → one refresh.
        let pending: ReturnType<typeof setTimeout> | null = null;
        const refresh = () => {
          if (pending) return;
          pending = setTimeout(() => {
            pending = null;
            router.refresh();
          }, 300);
        };
        let channel = sb
          .channel(`ride-${rideId}`)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "ride_requests", filter: `id=eq.${rideId}` }, refresh);
        if (driverId) {
          channel = channel.on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "driver_profiles", filter: `user_id=eq.${driverId}` },
            refresh,
          );
        }
        channel.subscribe();
        cleanup = () => {
          if (pending) clearTimeout(pending);
          void sb.removeChannel(channel);
        };
      })();
      const poll = setInterval(() => router.refresh(), pollMs);
      return () => {
        cancelled = true;
        clearInterval(poll);
        cleanup?.();
      };
    }

    const poll = setInterval(() => router.refresh(), pollMs);
    return () => clearInterval(poll);
  }, [router, rideId, driverId, enabled, intervalMs]);

  return null;
}

"use client";

import * as React from "react";
import { Navigation, NavigationOff } from "lucide-react";
import { updateDriverLocationAction } from "@/lib/actions/driver";

/**
 * Publishes the driver's real GPS position while mounted (e.g. during an
 * active ride) so the customer can track them live. Throttled to ~8s.
 */
export function DriverLocationPublisher() {
  const [state, setState] = React.useState<"idle" | "sharing" | "denied">("idle");
  const lastSent = React.useRef(0);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("denied");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState("sharing");
        const now = Date.now();
        if (now - lastSent.current < 8000) return;
        lastSent.current = now;
        void updateDriverLocationAction(pos.coords.latitude, pos.coords.longitude);
      },
      () => setState("denied"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-subtle px-3 py-2 text-xs font-medium text-muted-foreground">
      {state === "sharing" ? (
        <>
          <Navigation className="size-3.5 text-primary" /> Position partagée avec le client en temps réel
        </>
      ) : state === "denied" ? (
        <>
          <NavigationOff className="size-3.5 text-warning" /> Activez la localisation pour partager votre position
        </>
      ) : (
        <>
          <Navigation className="size-3.5" /> Localisation en cours…
        </>
      )}
    </div>
  );
}

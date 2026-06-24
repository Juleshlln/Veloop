"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Route as RouteIcon, Clock, Users, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/veloop/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { acceptRideAction, refuseRideAction } from "@/lib/actions/driver";
import { formatDistance, formatDuration, formatEuro } from "@/lib/utils";

export interface IncomingRide {
  id: string;
  pickupCity: string;
  destinationAddress: string;
  distanceKm: number;
  durationMin: number;
  distanceToClientKm: number;
  remuneration: number;
  passengerCount: number;
}

export function IncomingRides({ rides }: { rides: IncomingRide[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [hidden, setHidden] = React.useState<string[]>([]);

  const visible = rides.filter((r) => !hidden.includes(r.id));

  function accept(id: string) {
    setPendingId(id);
    // acceptRideAction redirects to the course on success.
    acceptRideAction(id).then((res) => {
      if (res?.error) {
        toast({ title: res.error, tone: "error" });
        setPendingId(null);
        router.refresh();
      }
    });
  }

  function refuse(id: string) {
    setHidden((h) => [...h, id]);
    refuseRideAction(id);
    toast({ title: "Course refusée", tone: "info" });
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={Bike}
        title="Aucune course disponible"
        description="Les nouvelles demandes apparaîtront ici lorsque vous êtes en ligne."
      />
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((ride) => (
        <Card key={ride.id} className="p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
              <Navigation className="size-3.5" /> à {formatDistance(ride.distanceToClientKm)}
            </span>
            <span className="text-right">
              <span className="block text-xs text-muted-foreground">Rémunération estimée</span>
              <span className="text-lg font-extrabold text-foreground">{formatEuro(ride.remuneration)}</span>
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-foreground">Prise en charge · {ride.pickupCity}</span>
            </p>
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span className="truncate text-foreground">{ride.destinationAddress}</span>
            </p>
          </div>

          <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><RouteIcon className="size-3.5" /> {formatDistance(ride.distanceKm)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {formatDuration(ride.durationMin)}</span>
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {ride.passengerCount}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => refuse(ride.id)} disabled={pendingId === ride.id}>
              Refuser
            </Button>
            <Button onClick={() => accept(ride.id)} disabled={pendingId !== null}>
              {pendingId === ride.id ? <Spinner className="text-current" /> : "Accepter"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

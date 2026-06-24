"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { assignDriverAction, setRideStatusAction } from "@/lib/actions/admin";
import { RIDE_STATUS_META, type RideStatus } from "@/lib/types";

const STATUS_OPTIONS = Object.entries(RIDE_STATUS_META) as [RideStatus, { label: string }][];

export function AdminRideControls({
  rideId,
  status,
  driverId,
  drivers,
}: {
  rideId: string;
  status: RideStatus;
  driverId: string | null;
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();

  function assign(id: string) {
    if (!id) return;
    startTransition(async () => {
      const res = await assignDriverAction(rideId, id);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Chauffeur assigné", tone: "success" }); router.refresh(); }
    });
  }

  function changeStatus(s: RideStatus) {
    startTransition(async () => {
      const res = await setRideStatusAction(rideId, s);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Statut mis à jour", tone: "success" }); router.refresh(); }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Assigner un chauffeur</Label>
        <Select defaultValue={driverId ?? ""} onChange={(e) => assign(e.target.value)}>
          <option value="" disabled>Choisir un chauffeur…</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Modifier le statut</Label>
        <Select value={status} onChange={(e) => changeStatus(e.target.value as RideStatus)}>
          {STATUS_OPTIONS.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
        </Select>
      </div>
    </div>
  );
}

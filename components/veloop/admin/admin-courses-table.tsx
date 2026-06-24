"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { toast } from "@/components/ui/toaster";
import { assignDriverAction, setRideStatusAction } from "@/lib/actions/admin";
import { formatEuro, formatRelative } from "@/lib/utils";
import { RIDE_STATUS_META, ACTIVE_RIDE_STATUSES, type RideStatus } from "@/lib/types";

export interface AdminRideRow {
  id: string;
  customerName: string;
  driverName: string | null;
  driverId: string | null;
  pickup: string;
  destination: string;
  createdAt: string;
  amount: number;
  status: RideStatus;
}

const STATUS_OPTIONS = Object.entries(RIDE_STATUS_META) as [RideStatus, { label: string }][];

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "active", label: "Actives" },
  { key: "completed", label: "Terminées" },
  { key: "cancelled", label: "Annulées" },
] as const;

export function AdminCoursesTable({ rides, drivers }: { rides: AdminRideRow[]; drivers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["key"]>("all");
  const [, startTransition] = React.useTransition();

  const filtered = rides.filter((r) => {
    if (filter === "all") return true;
    if (filter === "active") return ACTIVE_RIDE_STATUSES.includes(r.status);
    if (filter === "completed") return r.status === "trip_completed";
    if (filter === "cancelled") return r.status === "cancelled" || r.status === "incident_reported";
    return true;
  });

  function changeStatus(id: string, status: RideStatus) {
    startTransition(async () => {
      const res = await setRideStatusAction(id, status);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Statut mis à jour", tone: "success" }); router.refresh(); }
    });
  }

  function assign(id: string, driverId: string) {
    if (!driverId) return;
    startTransition(async () => {
      const res = await assignDriverAction(id, driverId);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Chauffeur assigné", tone: "success" }); router.refresh(); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((ride) => (
          <Card key={ride.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{ride.customerName}</p>
                <p className="text-xs text-muted-foreground">{formatRelative(ride.createdAt)} · {formatEuro(ride.amount)}</p>
              </div>
              <RideStatusBadge status={ride.status} />
            </div>

            <div className="mt-2 space-y-0.5 text-sm">
              <p className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /> <span className="truncate text-muted-foreground">{ride.pickup}</span></p>
              <p className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" /> <span className="truncate text-muted-foreground">{ride.destination}</span></p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-3">
              {/* assign */}
              {ride.driverId ? (
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Chauffeur</span>
                  <p className="font-medium text-foreground">{ride.driverName}</p>
                </div>
              ) : (
                <Select defaultValue="" onChange={(e) => assign(ride.id, e.target.value)} className="h-10 text-sm">
                  <option value="" disabled>Assigner un chauffeur…</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              )}

              {/* status */}
              <Select value={ride.status} onChange={(e) => changeStatus(ride.id, e.target.value as RideStatus)} className="h-10 text-sm">
                {STATUS_OPTIONS.map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </Select>

              <Link href={`/admin/courses/${ride.id}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-subtle">
                <ExternalLink className="size-4" /> Détail
              </Link>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            <UserPlus className="mx-auto mb-2 size-6 text-muted-foreground" />
            Aucune course dans ce filtre.
          </Card>
        )}
      </div>
    </div>
  );
}

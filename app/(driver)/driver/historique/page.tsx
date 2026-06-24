import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { EmptyState } from "@/components/veloop/empty-state";
import { DRIVER_SHARE } from "@/lib/config";
import { formatDateTime, formatEuro } from "@/lib/utils";

export const metadata = { title: "Mes courses" };

export default async function DriverHistorique() {
  const user = await requireRole("driver");
  const rides = await db.listRidesForDriver(user.id);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mes courses</h1>
      {rides.length === 0 ? (
        <EmptyState icon={Clock} title="Aucune course" description="Vos courses acceptées apparaîtront ici." />
      ) : (
        <div className="space-y-2">
          {rides.map((ride) => (
            <Link key={ride.id} href={`/driver/course/${ride.id}`}>
              <Card className="p-4 transition-colors hover:border-primary/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{formatDateTime(ride.scheduled_at ?? ride.created_at)}</p>
                  <RideStatusBadge status={ride.status} />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-foreground">{ride.pickup_address}</p>
                <p className="truncate text-sm text-muted-foreground">→ {ride.destination_address}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    {ride.customer?.first_name ?? "Client"}
                    {ride.rating && <span className="ml-2 inline-flex items-center gap-0.5"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {ride.rating.score}</span>}
                  </span>
                  {ride.status === "trip_completed" && (
                    <span className="font-bold text-foreground">{formatEuro((ride.final_price ?? 0) * DRIVER_SHARE)}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

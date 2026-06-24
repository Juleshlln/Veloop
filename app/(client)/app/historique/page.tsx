import Link from "next/link";
import { Clock, MapPin, Star, PlusCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { EmptyState } from "@/components/veloop/empty-state";
import { formatDateTime, formatEuro } from "@/lib/utils";

export const metadata = { title: "Mes courses" };

export default async function HistoriquePage() {
  const user = await requireRole("customer");
  const rides = await db.listRidesForCustomer(user.id);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mes courses</h1>

      {rides.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Aucune course pour le moment"
          description="Vos courses passées et à venir apparaîtront ici."
          action={<Button asChild><Link href="/app/nouvelle-course"><PlusCircle /> Commander</Link></Button>}
        />
      ) : (
        <div className="space-y-2">
          {rides.map((ride) => (
            <Link key={ride.id} href={`/app/course/${ride.id}`}>
              <Card className="p-4 transition-colors hover:border-primary/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{formatDateTime(ride.scheduled_at ?? ride.created_at)}</p>
                  <RideStatusBadge status={ride.status} />
                </div>
                <div className="mt-2 space-y-1">
                  <p className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <span className="truncate text-foreground">{ride.pickup_address}</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" />
                    <span className="truncate text-foreground">{ride.destination_address}</span>
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {ride.driver ? (
                      <>
                        <MapPin className="size-4" /> {ride.driver.first_name}
                      </>
                    ) : (
                      "Sans chauffeur"
                    )}
                    {ride.rating && (
                      <span className="inline-flex items-center gap-0.5">· <Star className="size-3.5 fill-amber-400 text-amber-400" /> {ride.rating.score}</span>
                    )}
                  </span>
                  <span className="font-bold text-foreground">{formatEuro(ride.final_price ?? ride.estimated_price)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Car, Clock, MapPin, PlusCircle, Star, LifeBuoy } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { formatRelative, formatEuro } from "@/lib/utils";
import { RIDE_STATUS_META } from "@/lib/types";

export default async function ClientHome() {
  const user = await requireRole("customer");
  const [active, rides, vehicles] = await Promise.all([
    db.getActiveRideForCustomer(user.id),
    db.listRidesForCustomer(user.id),
    db.listVehicles(user.id),
  ]);
  const recent = rides.filter((r) => r.id !== active?.id).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Bonjour</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{user.first_name} 👋</h1>
      </div>

      {active ? (
        <Link href={`/app/course/${active.id}`} className="block">
          <Card className="border-primary/30 bg-primary-soft/40 p-5 transition-colors hover:bg-primary-soft/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Course en cours</span>
              <RideStatusBadge status={active.status} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{RIDE_STATUS_META[active.status].description}</p>
            <div className="mt-3 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-foreground">{active.destination_address}</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Suivre ma course <ArrowRight className="size-4" />
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-[#0a6650] p-6 text-primary-foreground">
            <h2 className="text-xl font-extrabold">Rentrez avec votre voiture</h2>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Un chauffeur vous rejoint à vélo pliable et vous raccompagne.
            </p>
            <Button asChild variant="accent" size="lg" className="mt-5 w-full">
              <Link href="/app/nouvelle-course">
                <PlusCircle /> Commander un chauffeur
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/app/vehicules", icon: Car, label: "Véhicules", value: `${vehicles.length}` },
          { href: "/app/historique", icon: Clock, label: "Courses", value: `${rides.length}` },
          { href: "/app/support", icon: LifeBuoy, label: "Support", value: "" },
        ].map((q) => (
          <Link key={q.href} href={q.href}>
            <Card className="flex h-full flex-col items-start gap-2 p-4 transition-colors hover:border-primary/40">
              <q.icon className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{q.label}</p>
                {q.value && <p className="text-xs text-muted-foreground">{q.value}</p>}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent rides */}
      {recent.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-foreground">Courses récentes</h2>
            <Link href="/app/historique" className="text-sm font-medium text-primary">Tout voir</Link>
          </div>
          <div className="space-y-2">
            {recent.map((ride) => (
              <Link key={ride.id} href={`/app/course/${ride.id}`}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary/40">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <MapPin className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{ride.destination_address}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(ride.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatEuro(ride.final_price ?? ride.estimated_price)}</p>
                    {ride.rating && (
                      <p className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="size-3 fill-amber-400 text-amber-400" /> {ride.rating.score}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

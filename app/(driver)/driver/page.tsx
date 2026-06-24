import Link from "next/link";
import { ArrowRight, Wallet, CheckCircle2, MapPin, Clock, AlertCircle, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { OnlineToggle } from "@/components/veloop/driver/online-toggle";
import { IncomingRides, type IncomingRide } from "@/components/veloop/driver/incoming-rides";
import { AutoRefresher } from "@/components/veloop/auto-refresher";
import { haversineKm } from "@/lib/geo";
import { DRIVER_SHARE, LAUNCH_ZONE } from "@/lib/config";
import { formatEuro } from "@/lib/utils";
import { ACTIVE_RIDE_STATUSES } from "@/lib/types";

function pickupCity(address: string): string {
  const parts = address.split(",");
  return parts[parts.length - 1]?.trim() ?? address;
}

export default async function DriverHome() {
  const user = await requireRole("driver");
  const dp = await db.getDriverProfile(user.id);
  const approved = dp?.approval_status === "approved";

  const myRides = await db.listRidesForDriver(user.id);
  const activeRide = myRides.find((r) => ACTIVE_RIDE_STATUSES.includes(r.status));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayEarnings = myRides
    .filter((r) => r.status === "trip_completed" && new Date(r.updated_at) >= startOfToday)
    .reduce((sum, r) => sum + (r.final_price ?? 0) * DRIVER_SHARE, 0);
  const todayTrips = myRides.filter((r) => r.status === "trip_completed" && new Date(r.updated_at) >= startOfToday).length;

  // Available rides (only meaningful when online & approved).
  let incoming: IncomingRide[] = [];
  if (approved && dp?.is_online && !activeRide) {
    const open = await db.listOpenRides();
    const driverPos =
      dp.current_latitude != null ? { lat: dp.current_latitude, lng: dp.current_longitude! } : LAUNCH_ZONE.center;
    incoming = open.map((r) => ({
      id: r.id,
      pickupCity: pickupCity(r.pickup_address),
      destinationAddress: r.destination_address,
      distanceKm: r.estimated_distance_km,
      durationMin: r.estimated_duration_minutes,
      distanceToClientKm: Math.round(haversineKm(driverPos, { lat: r.pickup_latitude, lng: r.pickup_longitude }) * 10) / 10,
      remuneration: Math.round(r.estimated_price * DRIVER_SHARE * 100) / 100,
      passengerCount: r.passenger_count,
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{user.first_name}</h1>
        </div>
        <Badge variant={approved ? "success" : dp?.approval_status === "rejected" ? "danger" : "warning"}>
          {approved ? "Validé" : dp?.approval_status === "rejected" ? "Refusé" : "En attente"}
        </Badge>
      </div>

      {/* Approval banners */}
      {!approved && dp?.approval_status === "pending" && (
        <Card className="border-[#fbe7c6] bg-[#fdf6e9] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="font-semibold text-[#7a5a17]">Profil en cours de validation</p>
              <p className="mt-0.5 text-sm text-[#7a5a17]/80">Complétez votre profil et vos documents pour accélérer la validation.</p>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm"><Link href="/driver/onboarding">Compléter mon profil</Link></Button>
                <Button asChild size="sm" variant="outline"><Link href="/driver/documents"><FileText className="size-4" /> Documents</Link></Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {approved && <OnlineToggle online={Boolean(dp?.is_online)} approved={approved} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Wallet} label="Gains du jour" value={formatEuro(todayEarnings)} />
        <Stat icon={CheckCircle2} label="Courses" value={`${todayTrips}`} />
        <Stat icon={MapPin} label="Zone" value="Lille" />
      </div>

      {/* Active ride */}
      {activeRide && (
        <Link href={`/driver/course/${activeRide.id}`}>
          <Card className="border-primary/30 bg-primary-soft/40 p-5 transition-colors hover:bg-primary-soft/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Course en cours</span>
              <RideStatusBadge status={activeRide.status} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <MapPin className="size-4 text-primary" /> {activeRide.destination_address}
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Gérer la course <ArrowRight className="size-4" />
            </div>
          </Card>
        </Link>
      )}

      {/* Incoming rides */}
      {approved && dp?.is_online && !activeRide && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
            <Clock className="size-4 text-primary" /> Courses disponibles
          </h2>
          <IncomingRides rides={incoming} />
          <AutoRefresher enabled intervalMs={5000} />
        </div>
      )}

      {approved && !dp?.is_online && !activeRide && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Passez en ligne pour recevoir des courses.</p>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <Card className="flex flex-col items-start gap-1.5 p-4">
      <Icon className="size-5 text-primary" />
      <p className="text-lg font-extrabold leading-none text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

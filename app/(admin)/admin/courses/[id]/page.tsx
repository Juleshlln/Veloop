import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Bike, Car, Receipt } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { MapPreview } from "@/components/veloop/map-preview";
import { AdminRideControls } from "@/components/veloop/admin/admin-ride-controls";
import { formatDateTime, formatDistance, formatDuration, formatEuro } from "@/lib/utils";
import { RIDE_STATUS_META } from "@/lib/types";

export default async function AdminCourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("admin");
  const ride = await db.getRideWithRelations(id);
  if (!ride) notFound();
  const [history, drivers] = await Promise.all([db.getRideHistory(id), db.listDriverProfiles("approved")]);

  const driverOptions = drivers
    .filter((d) => d.profile)
    .map((d) => ({ id: d.user_id, name: `${d.profile!.first_name} ${d.profile!.last_name}` }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Courses
        </Link>
        <RideStatusBadge status={ride.status} />
      </div>

      <h1 className="text-xl font-extrabold tracking-tight text-foreground">Course {ride.id}</h1>

      <MapPreview
        pickup={{ lat: ride.pickup_latitude, lng: ride.pickup_longitude }}
        destination={{ lat: ride.destination_latitude, lng: ride.destination_longitude }}
        height={180}
      />

      <Card className="p-5">
        <h2 className="mb-3 font-bold text-foreground">Gestion</h2>
        <AdminRideControls rideId={ride.id} status={ride.status} driverId={ride.driver_id} drivers={driverOptions} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><User className="size-4 text-primary" /> Client</h3>
          <p className="mt-2 text-sm text-foreground">{ride.customer?.first_name} {ride.customer?.last_name}</p>
          <p className="text-sm text-muted-foreground">{ride.customer?.phone ?? "—"}</p>
        </Card>
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Bike className="size-4 text-primary" /> Chauffeur</h3>
          {ride.driver ? (
            <>
              <p className="mt-2 text-sm text-foreground">{ride.driver.first_name} {ride.driver.last_name}</p>
              <p className="text-sm text-muted-foreground">Note {ride.driverProfile?.average_rating?.toFixed(1) ?? "—"}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Non assigné</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="space-y-3">
          <Line color="var(--primary)" label="Départ" value={ride.pickup_address} />
          <Line color="#0b1f1a" label="Arrivée" value={ride.destination_address} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
          <Info icon={Car} label="Véhicule" value={ride.vehicle ? `${ride.vehicle.brand} ${ride.vehicle.model}` : "—"} />
          <Info icon={Receipt} label="Montant" value={formatEuro(ride.final_price ?? ride.estimated_price)} />
          <Info label="Distance" value={formatDistance(ride.estimated_distance_km)} />
          <Info label="Durée" value={formatDuration(ride.estimated_duration_minutes)} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-bold text-foreground">Historique des statuts</h2>
        <ol className="space-y-3">
          {history.map((event) => (
            <li key={event.id} className="flex items-center gap-3">
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground">{RIDE_STATUS_META[event.status].label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(event.created_at)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Line({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon?: typeof Car; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">{Icon && <Icon className="size-3.5" />} {label}</p>
      <p className="mt-0.5 font-semibold text-foreground">{value}</p>
    </div>
  );
}

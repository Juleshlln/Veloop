import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Car, Users, Wallet, MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { RideProgress } from "@/components/veloop/ride-progress";
import { MapPreview } from "@/components/veloop/map-preview";
import { DriverRideControls } from "@/components/veloop/driver/driver-ride-controls";
import { RealtimeRefresher } from "@/components/veloop/realtime-refresher";
import { EmergencyButton } from "@/components/veloop/emergency-button";
import { DriverLocationPublisher } from "@/components/veloop/driver-location-publisher";
import { DRIVER_SHARE } from "@/lib/config";
import { formatDistance, formatDuration, formatEuro } from "@/lib/utils";
import { ACTIVE_RIDE_STATUSES } from "@/lib/types";

export default async function DriverCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("driver");
  const ride = await db.getRideWithRelations(id);
  if (!ride || ride.driver_id !== user.id) notFound();

  const [inspection, inspectionPhotos] = await Promise.all([
    db.getInspection(id),
    db.listInspectionPhotos(id),
  ]);
  const isActive = ACTIVE_RIDE_STATUSES.includes(ride.status);
  const remuneration = (ride.final_price ?? ride.estimated_price) * DRIVER_SHARE;

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <Link href="/driver" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Tableau
        </Link>
        <RideStatusBadge status={ride.status} />
      </div>

      <MapPreview
        pickup={{ lat: ride.pickup_latitude, lng: ride.pickup_longitude }}
        destination={{ lat: ride.destination_latitude, lng: ride.destination_longitude }}
        driver={
          isActive && ride.driverProfile?.current_latitude != null
            ? { lat: ride.driverProfile.current_latitude, lng: ride.driverProfile.current_longitude! }
            : undefined
        }
        height={180}
      />

      {isActive && <DriverLocationPublisher />}

      {/* Client */}
      {ride.customer && (
        <Card className="flex items-center gap-3 p-4">
          <Avatar firstName={ride.customer.first_name} lastName={ride.customer.last_name} className="size-12" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground">{ride.customer.first_name} {ride.customer.last_name?.[0]}.</p>
            <p className="text-sm text-muted-foreground">Client · {ride.passenger_count} passager{ride.passenger_count > 1 ? "s" : ""}</p>
          </div>
          {ride.customer.phone && (
            <Button asChild variant="outline" size="icon" aria-label="Appeler le client">
              <a href={`tel:${ride.customer.phone.replace(/\s/g, "")}`}><Phone /></a>
            </Button>
          )}
        </Card>
      )}

      {/* Vehicle to drive */}
      {ride.vehicle && (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold text-foreground"><Car className="size-5 text-primary" /> Véhicule à conduire</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Modèle" value={`${ride.vehicle.brand} ${ride.vehicle.model}`} />
            <Info label="Immatriculation" value={ride.vehicle.registration_number} />
            <Info label="Couleur" value={ride.vehicle.color} />
            <Info label="Boîte" value={ride.vehicle.transmission_type} />
          </div>
          {ride.vehicle.notes && <p className="mt-3 rounded-xl bg-subtle p-3 text-sm text-muted-foreground">{ride.vehicle.notes}</p>}
        </Card>
      )}

      {/* Itinerary */}
      <Card className="p-5">
        <div className="space-y-3">
          <Line color="var(--primary)" label="Prise en charge" value={ride.pickup_address} />
          <Line color="#0b1f1a" label="Destination" value={ride.destination_address} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
          <Meta icon={MapPin} label="Distance" value={formatDistance(ride.estimated_distance_km)} />
          <Meta icon={Users} label="Durée" value={formatDuration(ride.estimated_duration_minutes)} />
          <Meta icon={Wallet} label="Rémunération" value={formatEuro(remuneration)} />
        </div>
      </Card>

      {/* Progress */}
      <Card className="p-5">
        <h2 className="mb-4 font-bold text-foreground">Étapes</h2>
        <RideProgress status={ride.status} />
      </Card>

      {ride.customer_notes && (
        <Card className="border-primary/30 bg-primary-soft/40 p-4">
          <p className="text-xs font-semibold text-primary">Note du client</p>
          <p className="mt-1 text-sm text-foreground">{ride.customer_notes}</p>
        </Card>
      )}

      {/* Controls */}
      <DriverRideControls
        rideId={ride.id}
        status={ride.status}
        driverInspectionConfirmed={Boolean(inspection?.driver_confirmed)}
        customerInspectionConfirmed={Boolean(inspection?.customer_confirmed)}
        inspectionPhotos={inspectionPhotos}
      />

      {isActive && (
        <div className="flex justify-center pt-2">
          <EmergencyButton rideId={ride.id} />
        </div>
      )}
      {isActive && <RealtimeRefresher rideId={ride.id} driverId={ride.driver_id} enabled />}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
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

function Meta({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="size-3.5" /> {label}</p>
      <p className="mt-0.5 font-semibold text-foreground">{value}</p>
    </div>
  );
}

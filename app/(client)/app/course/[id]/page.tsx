import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, Users, CalendarClock, Receipt, CreditCard, ShieldCheck, Bike } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { RideProgress } from "@/components/veloop/ride-progress";
import { MapPreview } from "@/components/veloop/map-preview";
import { DriverCard } from "@/components/veloop/driver-card";
import { RatingStars } from "@/components/veloop/rating-stars";
import { CustomerRideActions } from "@/components/veloop/customer-ride-actions";
import { InspectionSummary } from "@/components/veloop/inspection-summary";
import { AutoRefresher } from "@/components/veloop/auto-refresher";
import { EmergencyButton } from "@/components/veloop/emergency-button";
import { formatDateTime, formatDistance, formatDuration, formatEuro } from "@/lib/utils";
import { ACTIVE_RIDE_STATUSES, type Coordinates } from "@/lib/types";

const INSPECTION_ITEMS = [
  "L'état apparent du véhicule",
  "Que le véhicule est assuré",
  "Que le véhicule peut circuler",
  "Que le coffre peut accueillir le vélo pliable",
  "Que les clés ont été remises au chauffeur",
];

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("customer");
  const ride = await db.getRideWithRelations(id);
  if (!ride || ride.customer_id !== user.id) notFound();

  const [inspection, inspectionPhotos] = await Promise.all([
    db.getInspection(id),
    db.listInspectionPhotos(id),
  ]);
  const isActive = ACTIVE_RIDE_STATUSES.includes(ride.status);
  const isSearching = ride.status === "searching_driver" && !ride.driver_id;

  // Driver position for the map — prefer the driver's real live GPS.
  let driverCoord: Coordinates | null = null;
  const pickup = { lat: ride.pickup_latitude, lng: ride.pickup_longitude };
  const dest = { lat: ride.destination_latitude, lng: ride.destination_longitude };
  const liveDriver =
    ride.driverProfile?.current_latitude != null
      ? { lat: ride.driverProfile.current_latitude, lng: ride.driverProfile.current_longitude! }
      : null;
  const movingStatuses = ["driver_on_the_way", "trip_started", "trip_in_progress"];
  if (liveDriver && movingStatuses.includes(ride.status)) {
    driverCoord = liveDriver; // real-time position
  } else if (ride.status === "driver_arrived" || ride.status === "vehicle_check") {
    driverCoord = pickup;
  } else if (ride.status === "trip_started" || ride.status === "trip_in_progress") {
    driverCoord = { lat: (pickup.lat + dest.lat) / 2, lng: (pickup.lng + dest.lng) / 2 };
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Accueil
        </Link>
        <RideStatusBadge status={ride.status} />
      </div>

      {isSearching ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="relative flex size-16 items-center justify-center">
            <span className="absolute inline-flex size-16 rounded-full bg-primary/20 veloop-ping" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bike className="size-7" />
            </span>
          </span>
          <div>
            <h1 className="text-lg font-bold text-foreground">Recherche d&apos;un chauffeur Veloop</h1>
            <p className="mt-1 text-sm text-muted-foreground">Nous recherchons un chauffeur à proximité…</p>
          </div>
        </Card>
      ) : (
        <MapPreview pickup={pickup} destination={dest} driver={driverCoord} height={200} />
      )}

      {/* Driver */}
      {ride.driver && (
        <DriverCard
          driver={ride.driver}
          driverProfile={ride.driverProfile}
          etaMinutes={ride.status === "driver_on_the_way" ? ride.estimated_driver_arrival_minutes : undefined}
        />
      )}

      {/* Progress */}
      <Card className="p-5">
        <h2 className="mb-4 font-bold text-foreground">Suivi de la course</h2>
        <RideProgress status={ride.status} />
      </Card>

      {/* Vehicle inspection — guidance before the driver signs, evidence after. */}
      {ride.status === "vehicle_check" && !inspection?.driver_confirmed && (
        <Card className="border-primary/30 p-5">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="size-5 text-primary" /> Vérification avant départ
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Confirmez avec votre chauffeur :</p>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground">
            {INSPECTION_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /> {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {inspection?.driver_confirmed && (ride.status === "vehicle_check" || ride.status === "trip_completed") && (
        <InspectionSummary inspection={inspection} photos={inspectionPhotos} />
      )}

      {/* Trip details */}
      <Card className="p-5">
        <div className="space-y-3">
          <Detail color="var(--primary)" label="Départ" value={ride.pickup_address} />
          <Detail color="#0b1f1a" label="Arrivée" value={ride.destination_address} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
          <Meta icon={Car} label="Véhicule" value={ride.vehicle ? `${ride.vehicle.brand} ${ride.vehicle.model}` : "—"} />
          <Meta icon={Users} label="Passagers" value={`${ride.passenger_count}`} />
          <Meta
            icon={CalendarClock}
            label={ride.scheduled_at ? "Planifiée" : "Demandée"}
            value={formatDateTime(ride.scheduled_at ?? ride.created_at)}
          />
        </div>
      </Card>

      {/* Price / receipt */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-foreground">
            <Receipt className="size-5 text-primary" />
            {ride.status === "trip_completed" ? "Reçu" : "Estimation"}
          </span>
          <span className="text-xl font-extrabold text-foreground">
            {formatEuro(ride.final_price ?? ride.estimated_price)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Meta icon={CreditCard} label="Paiement" value={paymentLabel(ride.payment?.status)} />
          <div>
            <p className="text-xs text-muted-foreground">Distance · durée</p>
            <p className="font-medium text-foreground">
              {formatDistance(ride.estimated_distance_km)} · {formatDuration(ride.estimated_duration_minutes)}
            </p>
          </div>
        </div>
        {ride.rating && (
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Votre note :</span>
            <RatingStars value={ride.rating.score} readOnly size={16} />
          </div>
        )}
      </Card>

      {/* Actions */}
      <CustomerRideActions
        rideId={ride.id}
        status={ride.status}
        hasRating={Boolean(ride.rating)}
        customerInspectionConfirmed={Boolean(inspection?.customer_confirmed)}
        driverInspectionConfirmed={Boolean(inspection?.driver_confirmed)}
      />

      {isActive && (
        <div className="flex justify-center pt-2">
          <EmergencyButton rideId={ride.id} />
        </div>
      )}

      {isActive && <AutoRefresher enabled />}
    </div>
  );
}

function paymentLabel(status?: string): string {
  switch (status) {
    case "paid": return "Payé";
    case "authorized": return "Pré-autorisé";
    case "failed": return "Échec";
    case "refunded": return "Remboursé";
    default: return "En attente";
  }
}

function Detail({ color, label, value }: { color: string; label: string; value: string }) {
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
      <p className="mt-0.5 truncate font-medium text-foreground">{value}</p>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Users, Car, AlertCircle, CalendarClock, Bike, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/veloop/address-autocomplete";
import { VehicleCard } from "@/components/veloop/vehicle-card";
import { MapPreview } from "@/components/veloop/map-preview";
import { PriceBreakdown } from "@/components/veloop/price-breakdown";
import { EmptyState } from "@/components/veloop/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { estimateRideAction, createRideAction, type EstimateResult } from "@/lib/actions/rides";
import { formatDistance, formatDuration, formatEuro } from "@/lib/utils";
import type { CustomerVehicle, SavedAddress } from "@/lib/types";
import type { GeoPlace } from "@/lib/geo";

interface OrderFlowProps {
  vehicles: CustomerVehicle[];
  savedAddresses: SavedAddress[];
}

function defaultLater(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  // format for datetime-local (local time)
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function OrderFlow({ vehicles, savedAddresses }: OrderFlowProps) {
  const [step, setStep] = React.useState<"form" | "estimate">("form");
  const [pickup, setPickup] = React.useState<GeoPlace | null>(null);
  const [destination, setDestination] = React.useState<GeoPlace | null>(null);
  const [scheduleMode, setScheduleMode] = React.useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = React.useState<string>(defaultLater());
  const [passengers, setPassengers] = React.useState(1);
  const [vehicleId, setVehicleId] = React.useState<string>(vehicles[0]?.id ?? "");
  const [notes, setNotes] = React.useState("");
  const [carPresent, setCarPresent] = React.useState(false);
  const [estimate, setEstimate] = React.useState<EstimateResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Ajoutez d'abord votre voiture"
        description="Pour commander un chauffeur, enregistrez le véhicule avec lequel vous souhaitez rentrer."
        action={
          <Button asChild>
            <Link href="/app/vehicules">Ajouter un véhicule</Link>
          </Button>
        }
      />
    );
  }

  const scheduledIso = scheduleMode === "later" ? new Date(scheduledAt).toISOString() : null;

  function applySaved(addr: SavedAddress, target: "pickup" | "destination") {
    const place: GeoPlace = {
      id: addr.id,
      label: addr.label,
      address: addr.address,
      coordinates: { lat: addr.latitude, lng: addr.longitude },
    };
    if (target === "pickup") setPickup(place);
    else setDestination(place);
  }

  function goEstimate() {
    setError(null);
    if (!pickup || !destination) return setError("Renseignez l'adresse de départ et de destination.");
    if (!carPresent) return setError("Confirmez que votre voiture est bien sur place.");
    if (!vehicleId) return setError("Sélectionnez votre véhicule.");
    startTransition(async () => {
      const result = await estimateRideAction({
        pickup: { address: pickup.address, lat: pickup.coordinates.lat, lng: pickup.coordinates.lng },
        destination: { address: destination.address, lat: destination.coordinates.lat, lng: destination.coordinates.lng },
        scheduledAt: scheduledIso,
      });
      if (result.error) return setError(result.error);
      setEstimate(result);
      setStep("estimate");
      window.scrollTo({ top: 0 });
    });
  }

  function confirm() {
    if (!pickup || !destination) return;
    setError(null);
    startTransition(async () => {
      const result = await createRideAction({
        pickup: { address: pickup.address, lat: pickup.coordinates.lat, lng: pickup.coordinates.lng },
        destination: { address: destination.address, lat: destination.coordinates.lat, lng: destination.coordinates.lng },
        scheduledAt: scheduledIso,
        vehicleId,
        passengerCount: passengers,
        notes,
      });
      // On success createRideAction redirects; only errors return here.
      if (result?.error) setError(result.error);
    });
  }

  /* -------- Estimate screen -------- */
  if (step === "estimate" && estimate?.breakdown) {
    return (
      <div className="space-y-5">
        <button onClick={() => setStep("form")} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Modifier la course
        </button>

        <MapPreview pickup={pickup!.coordinates} destination={destination!.coordinates} height={180} />

        <Card className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={RouteIcon} label="Distance" value={formatDistance(estimate.distanceKm!)} />
            <Stat icon={Clock} label="Durée" value={formatDuration(estimate.durationMin!)} />
            <Stat icon={Bike} label="Chauffeur" value={`${estimate.driverArrivalMin} min`} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="space-y-3">
            <AddressLine color="var(--primary)" label="Départ" value={pickup!.address} />
            <AddressLine color="#0b1f1a" label="Arrivée" value={destination!.address} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold text-foreground">Détail du prix</h3>
          <PriceBreakdown breakdown={estimate.breakdown} estimate />
        </Card>

        {error && <ErrorBox message={error} />}

        <div className="sticky bottom-20 md:bottom-4">
          <Button size="lg" className="w-full shadow-lg" onClick={confirm} disabled={pending}>
            {pending ? <Spinner className="text-current" /> : `Confirmer pour ${formatEuro(estimate.breakdown.total)}`}
          </Button>
        </div>
      </div>
    );
  }

  /* -------- Form screen -------- */
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Nouvelle course</h1>

      <Card className="space-y-4 p-5">
        <AddressAutocomplete label="Adresse de prise en charge" placeholder="D'où partez-vous ?" value={pickup} onChange={setPickup} dotColor="var(--primary)" id="pickup" />
        <AddressAutocomplete label="Adresse de destination" placeholder="Où allez-vous ?" value={destination} onChange={setDestination} dotColor="#0b1f1a" id="destination" />
        {savedAddresses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedAddresses.map((a) => (
              <button
                key={a.id}
                onClick={() => applySaved(a, pickup ? "destination" : "pickup")}
                className="rounded-full border border-border bg-subtle px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </Card>

      {pickup && destination && (
        <MapPreview pickup={pickup.coordinates} destination={destination.coordinates} height={150} />
      )}

      {/* Schedule */}
      <Card className="p-5">
        <Label className="mb-2 block">Quand ?</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["now", "later"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setScheduleMode(mode)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                scheduleMode === mode ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground"
              }`}
            >
              {mode === "now" ? <Clock className="size-4" /> : <CalendarClock className="size-4" />}
              {mode === "now" ? "Maintenant" : "Plus tard"}
            </button>
          ))}
        </div>
        {scheduleMode === "later" && (
          <input
            type="datetime-local"
            value={scheduledAt}
            min={defaultLater()}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-3 flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
      </Card>

      {/* Passengers + vehicle */}
      <Card className="space-y-4 p-5">
        <div>
          <Label htmlFor="passengers" className="mb-2 flex items-center gap-2"><Users className="size-4" /> Nombre de passagers</Label>
          <Select id="passengers" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>{n} passager{n > 1 ? "s" : ""}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="mb-2 flex items-center gap-2"><Car className="size-4" /> Votre véhicule</Label>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} selected={vehicleId === v.id} onSelect={() => setVehicleId(v.id)} />
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="notes" className="mb-2 block">Informations particulières (optionnel)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Étage, code, précisions sur le point de rendez-vous…" />
        </div>
      </Card>

      {/* Car present confirmation */}
      <button
        onClick={() => setCarPresent((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
          carPresent ? "border-primary bg-primary-soft" : "border-border bg-card"
        }`}
      >
        <span className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${carPresent ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
          {carPresent && <span className="text-xs font-bold">✓</span>}
        </span>
        <span className="text-sm text-foreground">Je confirme disposer de ma voiture sur le lieu de prise en charge.</span>
      </button>

      {error && <ErrorBox message={error} />}

      <div className="sticky bottom-20 md:bottom-4">
        <Button size="lg" className="w-full shadow-lg" onClick={goEstimate} disabled={pending}>
          {pending ? <Spinner className="text-current" /> : <>Voir l&apos;estimation <ArrowRight /></>}
        </Button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div>
      <Icon className="mx-auto size-5 text-primary" />
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function AddressLine({ color, label, value }: { color: string; label: string; value: string }) {
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

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[#fdeaed] p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

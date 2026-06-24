"use client";

import * as React from "react";
import { Bike, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { completeOnboardingAction } from "@/lib/actions/driver";
import type { DriverProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OnboardingForm({ driverProfile }: { driverProfile: DriverProfile | null }) {
  const [dateOfBirth, setDateOfBirth] = React.useState(driverProfile?.date_of_birth ?? "");
  const [licenseNumber, setLicenseNumber] = React.useState(driverProfile?.driver_license_number ?? "");
  const [licenseExpiry, setLicenseExpiry] = React.useState(driverProfile?.driver_license_expiry ?? "");
  const [years, setYears] = React.useState(String(driverProfile?.years_of_experience ?? ""));
  const [bike, setBike] = React.useState(Boolean(driverProfile?.folding_bike_confirmed));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboardingAction({
        dateOfBirth,
        licenseNumber,
        licenseExpiry,
        yearsOfExperience: Number(years || 0),
        foldingBikeConfirmed: bike,
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Compléter mon profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ces informations permettent à notre équipe de valider votre compte chauffeur.</p>
      </div>

      <Card className="space-y-4 p-5">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-[#fdeaed] p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date de naissance</Label>
          <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lic">N° de permis</Label>
            <Input id="lic" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="59A12345678" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp">Expiration du permis</Label>
            <Input id="exp" type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yrs">Années d&apos;expérience de conduite</Label>
          <Input id="yrs" type="number" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} placeholder="5" />
        </div>

        <button
          type="button"
          onClick={() => setBike((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
            bike ? "border-primary bg-primary-soft" : "border-border",
          )}
        >
          <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border-2", bike ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
            {bike && <span className="text-xs font-bold">✓</span>}
          </span>
          <span className="flex items-center gap-2 text-sm text-foreground">
            <Bike className="size-4 text-primary" /> Je confirme disposer d&apos;un vélo pliable.
          </span>
        </button>

        <Button size="lg" className="w-full" onClick={submit} disabled={pending}>
          {pending ? <Spinner className="text-current" /> : "Enregistrer mon profil"}
        </Button>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Les documents (permis, identité) sont à transmettre depuis la page Documents. La validation finale est manuelle.
      </p>
    </div>
  );
}

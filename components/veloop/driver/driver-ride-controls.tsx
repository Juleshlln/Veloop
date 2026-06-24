"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, Flag, X, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationSheet } from "@/components/veloop/confirmation-sheet";
import { toast } from "@/components/ui/toaster";
import { advanceRideStatusAction, driverConfirmInspectionAction } from "@/lib/actions/driver";
import { cancelRideAction } from "@/lib/actions/rides";
import type { RideStatus } from "@/lib/types";

const CHECKLIST = [
  "Identité du client confirmée",
  "Véhicule correspondant à la réservation",
  "État extérieur vérifié",
  "Photos prises",
  "Documents du véhicule confirmés",
  "Vélo correctement rangé dans le coffre",
  "Destination confirmée",
];

const NEXT_STEP: Partial<Record<RideStatus, { label: string; next: RideStatus; icon: typeof ArrowRight }>> = {
  driver_assigned: { label: "Je suis en route", next: "driver_on_the_way", icon: ArrowRight },
  driver_on_the_way: { label: "Je suis arrivé", next: "driver_arrived", icon: Flag },
  driver_arrived: { label: "Vérification du véhicule", next: "vehicle_check", icon: ClipboardCheck },
  trip_started: { label: "Confirmer le trajet en cours", next: "trip_in_progress", icon: PlayCircle },
  trip_in_progress: { label: "Course terminée", next: "trip_completed", icon: Flag },
};

const CANCELLABLE: RideStatus[] = ["driver_assigned", "driver_on_the_way", "driver_arrived"];

interface Props {
  rideId: string;
  status: RideStatus;
  driverInspectionConfirmed: boolean;
}

export function DriverRideControls({ rideId, status, driverInspectionConfirmed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [checkOpen, setCheckOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [checked, setChecked] = React.useState<boolean[]>(() => CHECKLIST.map(() => false));
  const [mileage, setMileage] = React.useState("");

  const allChecked = checked.every(Boolean);

  function run(fn: () => Promise<{ error?: string; ok?: boolean }>, onOk?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast({ title: res.error, tone: "error" });
      else {
        onOk?.();
        router.refresh();
      }
    });
  }

  const step = NEXT_STEP[status];

  return (
    <div className="space-y-3">
      {status === "vehicle_check" ? (
        <>
          {!driverInspectionConfirmed ? (
            <Button size="lg" className="w-full" onClick={() => setCheckOpen(true)}>
              <ClipboardCheck /> Remplir la checklist
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={() => run(() => advanceRideStatusAction(rideId, "trip_started"), () => toast({ title: "Course démarrée", tone: "success" }))}
            >
              {pending ? <Spinner className="text-current" /> : <><PlayCircle /> Démarrer la course</>}
            </Button>
          )}
        </>
      ) : step ? (
        <Button
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={() => run(() => advanceRideStatusAction(rideId, step.next))}
        >
          {pending ? <Spinner className="text-current" /> : <><step.icon /> {step.label}</>}
        </Button>
      ) : null}

      {CANCELLABLE.includes(status) && (
        <Button variant="ghost" className="w-full text-destructive" onClick={() => setCancelOpen(true)}>
          <X /> Annuler la course
        </Button>
      )}

      {/* Checklist sheet */}
      <ConfirmationSheet
        open={checkOpen}
        onOpenChange={setCheckOpen}
        title="Checklist avant départ"
        description="Confirmez chaque point avec le client avant de démarrer."
        confirmLabel="Valider la checklist"
        loading={pending}
        onConfirm={() => {
          if (!allChecked) return toast({ title: "Cochez tous les points.", tone: "warning" });
          run(
            () => driverConfirmInspectionAction({ rideId, initialMileage: mileage ? Number(mileage) : undefined }),
            () => { setCheckOpen(false); toast({ title: "Checklist validée", tone: "success" }); },
          );
        }}
      >
        <div className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left"
            >
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${checked[i] ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                {checked[i] && <span className="text-xs font-bold">✓</span>}
              </span>
              <span className="text-sm text-foreground">{item}</span>
            </button>
          ))}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="mileage">Kilométrage initial (optionnel)</Label>
            <Input id="mileage" type="number" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="km au compteur" />
          </div>
        </div>
      </ConfirmationSheet>

      {/* Cancel sheet */}
      <ConfirmationSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Annuler la course ?"
        tone="destructive"
        confirmLabel="Confirmer l'annulation"
        cancelLabel="Continuer la course"
        loading={pending}
        onConfirm={() => run(() => cancelRideAction(rideId, reason || "Annulée par le chauffeur"), () => { setCancelOpen(false); toast({ title: "Course annulée", tone: "info" }); })}
      >
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison (optionnel)" />
      </ConfirmationSheet>
    </div>
  );
}

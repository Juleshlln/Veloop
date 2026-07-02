"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, Flag, X, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationSheet } from "@/components/veloop/confirmation-sheet";
import { InspectionFlow } from "./inspection-flow";
import { toast } from "@/components/ui/toaster";
import { advanceRideStatusAction } from "@/lib/actions/driver";
import { cancelRideAction } from "@/lib/actions/rides";
import type { InspectionPhoto, RideStatus } from "@/lib/types";

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
  customerInspectionConfirmed: boolean;
  inspectionPhotos: InspectionPhoto[];
}

export function DriverRideControls({
  rideId,
  status,
  driverInspectionConfirmed,
  customerInspectionConfirmed,
  inspectionPhotos,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [inspectionOpen, setInspectionOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

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
            <Button size="lg" className="w-full" onClick={() => setInspectionOpen(true)}>
              <ClipboardCheck /> Faire l&apos;état des lieux
            </Button>
          ) : (
            <>
              {!customerInspectionConfirmed && (
                <p className="rounded-xl bg-primary-soft p-3 text-center text-sm font-medium text-primary">
                  État des lieux signé. En attente de la confirmation du client.
                </p>
              )}
              <Button
                size="lg"
                className="w-full"
                disabled={pending || !customerInspectionConfirmed}
                onClick={() => run(() => advanceRideStatusAction(rideId, "trip_started"), () => toast({ title: "Course démarrée", tone: "success" }))}
              >
                {pending ? <Spinner className="text-current" /> : <><PlayCircle /> Démarrer la course</>}
              </Button>
            </>
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

      <InspectionFlow rideId={rideId} photos={inspectionPhotos} open={inspectionOpen} onOpenChange={setInspectionOpen} />

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

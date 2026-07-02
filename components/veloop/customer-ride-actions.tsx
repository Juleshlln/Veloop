"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, ClipboardCheck, Star, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationSheet } from "./confirmation-sheet";
import { RatingStars } from "./rating-stars";
import { toast } from "@/components/ui/toaster";
import { SHOW_DEMO_LOGIN } from "@/lib/config";
import { cancelRideAction, customerConfirmInspectionAction, rateRideAction } from "@/lib/actions/rides";
import { autoDispatchAction, demoAdvanceRideAction } from "@/lib/actions/demo";
import { ACTIVE_RIDE_STATUSES, type RideStatus } from "@/lib/types";

const CANCELLABLE: RideStatus[] = [
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_on_the_way",
  "driver_arrived",
];

interface Props {
  rideId: string;
  status: RideStatus;
  hasRating: boolean;
  customerInspectionConfirmed: boolean;
  driverInspectionConfirmed: boolean;
}

export function CustomerRideActions({ rideId, status, hasRating, customerInspectionConfirmed, driverInspectionConfirmed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [rateOpen, setRateOpen] = React.useState(false);
  const [score, setScore] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const dispatchedRef = React.useRef(false);

  // Simulated automatic dispatch shortly after the search begins.
  React.useEffect(() => {
    if (status !== "searching_driver" || dispatchedRef.current) return;
    dispatchedRef.current = true;
    const t = setTimeout(async () => {
      await autoDispatchAction(rideId);
      router.refresh();
    }, 2500);
    return () => clearTimeout(t);
  }, [status, rideId, router]);

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

  const isActive = ACTIVE_RIDE_STATUSES.includes(status);

  return (
    <div className="space-y-3">
      {status === "vehicle_check" && !customerInspectionConfirmed && !driverInspectionConfirmed && (
        <p className="rounded-xl bg-subtle p-3 text-center text-sm text-muted-foreground">
          Le chauffeur réalise l&apos;état des lieux (photos, kilométrage)…
        </p>
      )}

      {status === "vehicle_check" && !customerInspectionConfirmed && driverInspectionConfirmed && (
        <Button
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={() => run(() => customerConfirmInspectionAction(rideId), () => toast({ title: "État des lieux confirmé", tone: "success" }))}
        >
          <ClipboardCheck /> Je confirme l&apos;état des lieux
        </Button>
      )}

      {status === "vehicle_check" && customerInspectionConfirmed && (
        <p className="rounded-xl bg-primary-soft p-3 text-center text-sm font-medium text-primary">
          État des lieux signé par les deux parties. Le chauffeur peut démarrer.
        </p>
      )}

      {status === "trip_completed" && !hasRating && (
        <Button size="lg" className="w-full" onClick={() => setRateOpen(true)}>
          <Star /> Noter mon chauffeur
        </Button>
      )}

      {SHOW_DEMO_LOGIN && isActive && (
        <Button
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => run(() => demoAdvanceRideAction(rideId))}
        >
          {pending ? <Spinner /> : <><FastForward className="size-4" /> Simuler l&apos;étape suivante (démo)</>}
        </Button>
      )}

      {CANCELLABLE.includes(status) && (
        <Button variant="ghost" className="w-full text-destructive" onClick={() => setCancelOpen(true)}>
          <X /> Annuler la course
        </Button>
      )}

      {/* Cancel sheet */}
      <ConfirmationSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Annuler la course ?"
        description="Indiquez la raison de l'annulation (facultatif)."
        confirmLabel="Confirmer l'annulation"
        cancelLabel="Garder ma course"
        tone="destructive"
        loading={pending}
        onConfirm={() => run(() => cancelRideAction(rideId, reason), () => { setCancelOpen(false); toast({ title: "Course annulée", tone: "info" }); })}
      >
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison (optionnel)" />
      </ConfirmationSheet>

      {/* Rating sheet */}
      <ConfirmationSheet
        open={rateOpen}
        onOpenChange={setRateOpen}
        title="Noter votre chauffeur"
        description="Votre avis nous aide à garantir la qualité du service."
        confirmLabel="Envoyer mon évaluation"
        loading={pending}
        onConfirm={() =>
          run(
            () => rateRideAction({ rideId, score, comment }),
            () => { setRateOpen(false); toast({ title: "Merci pour votre évaluation !", tone: "success" }); },
          )
        }
      >
        <div className="flex flex-col items-center gap-3">
          <RatingStars value={score} onChange={setScore} size={36} />
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire ? (optionnel)" className="w-full" />
        </div>
      </ConfirmationSheet>
    </div>
  );
}

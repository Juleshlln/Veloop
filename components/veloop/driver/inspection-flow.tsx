"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Gauge, FileSignature, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationSheet } from "@/components/veloop/confirmation-sheet";
import { toast } from "@/components/ui/toaster";
import { compressImage } from "@/lib/image";
import { INSPECTION_ANGLES, REQUIRED_ANGLE_TYPES, DRIVER_CHECKLIST } from "@/lib/inspection";
import { uploadInspectionPhotoAction, driverConfirmInspectionAction } from "@/lib/actions/driver";
import { cn } from "@/lib/utils";
import type { InspectionPhoto } from "@/lib/types";

interface InspectionFlowProps {
  rideId: string;
  photos: InspectionPhoto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Guided pre-trip inspection: photo of each angle, mileage, existing damage,
 * checklist, then a timestamped driver sign-off. Photos upload immediately so
 * the evidence exists even if the flow is interrupted.
 */
export function InspectionFlow({ rideId, photos, open, onOpenChange }: InspectionFlowProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [mileage, setMileage] = React.useState("");
  const [damage, setDamage] = React.useState("");
  const [checked, setChecked] = React.useState<boolean[]>(() => DRIVER_CHECKLIST.map(() => false));
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const photoByType = new Map(photos.map((p) => [p.photo_type, p]));
  const missingRequired = REQUIRED_ANGLE_TYPES.filter((t) => !photoByType.has(t));
  const allChecked = checked.every(Boolean);
  const canSign = missingRequired.length === 0 && allChecked && Number(mileage) > 0;

  async function handleFile(photoType: string, file: File) {
    setUploading(photoType);
    try {
      const dataUrl = await compressImage(file);
      const res = await uploadInspectionPhotoAction(rideId, photoType, dataUrl);
      if (res.error) toast({ title: res.error, tone: "error" });
      else router.refresh();
    } catch {
      toast({ title: "Impossible de traiter la photo.", tone: "error" });
    } finally {
      setUploading(null);
    }
  }

  function sign() {
    startTransition(async () => {
      const res = await driverConfirmInspectionAction({
        rideId,
        initialMileage: Number(mileage),
        damageNotes: damage,
      });
      if (res.error) toast({ title: res.error, tone: "error" });
      else {
        onOpenChange(false);
        toast({ title: "État des lieux signé", description: "En attente de la confirmation du client.", tone: "success" });
        router.refresh();
      }
    });
  }

  return (
    <ConfirmationSheet
      open={open}
      onOpenChange={onOpenChange}
      title="État des lieux du véhicule"
      description="Photos, kilométrage et vérifications avec le client. Ces éléments constituent la preuve de l'état du véhicule avant le trajet."
      hideActions
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        {/* 1. Photos */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Camera className="size-4 text-primary" /> Photos du véhicule
            <span className="text-xs font-normal text-muted-foreground">({4 - missingRequired.length}/4 obligatoires)</span>
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {INSPECTION_ANGLES.map((angle) => {
              const photo = photoByType.get(angle.type);
              const busy = uploading === angle.type;
              return (
                <button
                  key={angle.type}
                  type="button"
                  disabled={busy}
                  onClick={() => inputRefs.current[angle.type]?.click()}
                  className={cn(
                    "relative flex h-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border text-center transition-colors",
                    photo ? "border-primary" : "border-dashed border-border hover:border-primary/50",
                  )}
                >
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.file_url} alt={angle.label} className="absolute inset-0 size-full object-cover" />
                  )}
                  <span className={cn("relative z-10 flex flex-col items-center gap-1 px-2", photo && "rounded-lg bg-black/45 py-1 text-white")}>
                    {busy ? (
                      <Spinner className="size-4" />
                    ) : photo ? (
                      <RefreshCw className="size-4" />
                    ) : (
                      <Camera className="size-4 text-primary" />
                    )}
                    <span className="text-xs font-semibold">
                      {angle.label}
                      {!angle.required && " (option)"}
                    </span>
                    {!photo && <span className="text-[10px] text-muted-foreground">{angle.hint}</span>}
                  </span>
                  {photo && (
                    <span className="absolute right-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[angle.type] = el;
                    }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(angle.type, file);
                      e.target.value = "";
                    }}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Mileage */}
        <section className="space-y-1.5">
          <Label htmlFor="mileage" className="flex items-center gap-2">
            <Gauge className="size-4 text-primary" /> Kilométrage au compteur <span className="text-destructive">*</span>
          </Label>
          <Input
            id="mileage"
            type="number"
            inputMode="numeric"
            min={1}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="ex. 84 230"
          />
        </section>

        {/* 3. Existing damage */}
        <section className="space-y-1.5">
          <Label htmlFor="damage">État constaté / dégâts existants</Label>
          <Textarea
            id="damage"
            value={damage}
            onChange={(e) => setDamage(e.target.value)}
            placeholder="Rayures, impacts, éclats déjà présents… (vide = aucun dégât constaté)"
          />
        </section>

        {/* 4. Checklist */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">Vérifications avec le client</h3>
          {DRIVER_CHECKLIST.map((item, i) => (
            <button
              key={item}
              type="button"
              onClick={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left"
            >
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border-2", checked[i] ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                {checked[i] && <span className="text-xs font-bold">✓</span>}
              </span>
              <span className="text-sm text-foreground">{item}</span>
            </button>
          ))}
        </section>
      </div>

      {/* 5. Sign-off */}
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          En signant, je certifie l&apos;exactitude des photos, du kilométrage et de l&apos;état constaté
          ci-dessus. Cette signature est horodatée.
        </p>
        <Button size="lg" className="w-full" disabled={!canSign || pending} onClick={sign}>
          {pending ? <Spinner className="text-current" /> : <><FileSignature /> Signer l&apos;état des lieux</>}
        </Button>
        {!canSign && (
          <p className="text-center text-xs text-warning">
            {missingRequired.length > 0
              ? `${missingRequired.length} photo(s) obligatoire(s) manquante(s)`
              : Number(mileage) <= 0
                ? "Renseignez le kilométrage"
                : "Cochez toutes les vérifications"}
          </p>
        )}
      </div>
    </ConfirmationSheet>
  );
}

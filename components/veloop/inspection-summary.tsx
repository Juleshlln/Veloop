import { Camera, Gauge, FileSignature, Clock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { angleLabel } from "@/lib/inspection";
import { formatDateTime } from "@/lib/utils";
import type { InspectionPhoto, VehicleInspection } from "@/lib/types";

interface InspectionSummaryProps {
  inspection: VehicleInspection;
  photos: InspectionPhoto[];
  title?: string;
}

/** Read-only evidence view of the pre-trip inspection (photos, mileage, sign-offs). */
export function InspectionSummary({ inspection, photos, title = "État des lieux" }: InspectionSummaryProps) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-bold text-foreground">
        <FileSignature className="size-5 text-primary" /> {title}
      </h2>

      {photos.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Camera className="size-3.5" /> Photos avant départ
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <figure key={photo.id} className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.file_url} alt={angleLabel(photo.photo_type)} className="h-20 w-full object-cover" />
                <figcaption className="bg-subtle px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {angleLabel(photo.photo_type)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        {inspection.initial_mileage != null && (
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground"><Gauge className="size-4" /> Kilométrage relevé</dt>
            <dd className="font-semibold text-foreground">{inspection.initial_mileage.toLocaleString("fr-FR")} km</dd>
          </div>
        )}
        {inspection.notes && (
          <div>
            <dt className="text-muted-foreground">État constaté</dt>
            <dd className="mt-1 rounded-xl bg-subtle p-3 text-foreground">{inspection.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2">
        <SignOff label="Chauffeur" confirmed={inspection.driver_confirmed} at={inspection.driver_confirmed_at} />
        <SignOff label="Client" confirmed={inspection.customer_confirmed} at={inspection.customer_confirmed_at} />
      </div>
    </Card>
  );
}

function SignOff({ label, confirmed, at }: { label: string; confirmed: boolean; at: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {confirmed ? (
        <Badge variant="success">
          <CheckCircle2 className="size-3" /> Signé{at ? ` · ${formatDateTime(at)}` : ""}
        </Badge>
      ) : (
        <Badge variant="warning">
          <Clock className="size-3" /> En attente
        </Badge>
      )}
    </div>
  );
}

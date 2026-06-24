import Link from "next/link";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/veloop/empty-state";
import { IncidentStatusControl } from "@/components/veloop/admin/incident-status-control";
import { formatDateTime } from "@/lib/utils";
import type { IncidentPriority, IncidentType } from "@/lib/types";

export const metadata = { title: "Incidents" };

const TYPE_LABEL: Record<IncidentType, string> = {
  vehicle: "Véhicule",
  safety: "Sécurité",
  payment: "Paiement",
  behaviour: "Comportement",
  other: "Autre",
};

const PRIORITY: Record<IncidentPriority, { label: string; variant: "danger" | "warning" | "neutral" }> = {
  high: { label: "Haute", variant: "danger" },
  medium: { label: "Moyenne", variant: "warning" },
  low: { label: "Basse", variant: "neutral" },
};

export default async function AdminIncidentsPage() {
  await requireRole("admin");
  const incidents = await db.listIncidents();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Incidents</h1>
        <p className="mt-1 text-sm text-muted-foreground">{incidents.filter((i) => i.status !== "resolved").length} incident(s) ouvert(s).</p>
      </div>

      {incidents.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Aucun incident" description="Tout va bien pour le moment." />
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Card key={inc.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{TYPE_LABEL[inc.incident_type]}</Badge>
                  <Badge variant={PRIORITY[inc.priority].variant}>Priorité {PRIORITY[inc.priority].label}</Badge>
                </div>
                <IncidentStatusControl id={inc.id} status={inc.status} />
              </div>
              <p className="mt-3 text-sm text-foreground">{inc.description}</p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Signalé par {inc.reporter?.first_name ?? "—"} · {formatDateTime(inc.created_at)}</span>
                {inc.ride_id && (
                  <Link href={`/admin/courses/${inc.ride_id}`} className="inline-flex items-center gap-1 font-medium text-primary">
                    <ExternalLink className="size-3.5" /> Course
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

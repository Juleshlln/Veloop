import Link from "next/link";
import { Star, Bike, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ApprovalActions } from "@/components/veloop/admin/approval-actions";
import type { ApprovalStatus } from "@/lib/types";

export const metadata = { title: "Chauffeurs" };

const APPROVAL: Record<ApprovalStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  approved: { label: "Validé", variant: "success" },
  pending: { label: "En attente", variant: "warning" },
  rejected: { label: "Refusé", variant: "danger" },
};

export default async function AdminChauffeursPage() {
  await requireRole("admin");
  const drivers = await db.listDriverProfiles();
  // Pending first.
  const sorted = [...drivers].sort((a, b) => (a.approval_status === "pending" ? -1 : 1) - (b.approval_status === "pending" ? -1 : 1));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Chauffeurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Validez les nouveaux chauffeurs et suivez votre flotte.</p>
      </div>

      <div className="space-y-2">
        {sorted.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar firstName={d.profile?.first_name} lastName={d.profile?.last_name} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{d.profile?.first_name} {d.profile?.last_name}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {d.average_rating > 0 && <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" /> {d.average_rating.toFixed(1)}</span>}
                  <span>{d.completed_trips} courses</span>
                  <span className="inline-flex items-center gap-0.5"><Bike className="size-3" /> {d.folding_bike_confirmed ? "Vélo OK" : "Vélo ?"}</span>
                </p>
              </div>
              <Badge variant={APPROVAL[d.approval_status].variant}>{APPROVAL[d.approval_status].label}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <Link href={`/admin/chauffeurs/${d.user_id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                <ExternalLink className="size-4" /> Dossier
              </Link>
              <ApprovalActions userId={d.user_id} status={d.approval_status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { CreditCard } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/veloop/empty-state";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { IS_DEMO } from "@/lib/config";
import type { PaymentStatus } from "@/lib/types";

export const metadata = { title: "Paiements" };

const STATUS: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  paid: { label: "Payé", variant: "success" },
  authorized: { label: "Pré-autorisé", variant: "warning" },
  pending: { label: "En attente", variant: "neutral" },
  failed: { label: "Échec", variant: "danger" },
  refunded: { label: "Remboursé", variant: "neutral" },
};

export default async function AdminPaiementsPage() {
  await requireRole("admin");
  const payments = await db.listPayments();
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Paiements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Total encaissé : <span className="font-semibold text-foreground">{formatEuro(totalPaid)}</span>
          {IS_DEMO && " · paiements simulés (Stripe non connecté)"}
        </p>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="Aucun paiement" description="Les paiements apparaîtront ici." />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CreditCard className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{p.customer?.first_name} {p.customer?.last_name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.ride?.destination_address ?? "—"} · {formatDateTime(p.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{formatEuro(p.amount)}</p>
                <Badge variant={STATUS[p.status].variant}>{STATUS[p.status].label}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

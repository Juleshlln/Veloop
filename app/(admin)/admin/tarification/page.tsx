import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { PricingEditor } from "@/components/veloop/admin/pricing-editor";

export const metadata = { title: "Tarification" };

export default async function AdminTarificationPage() {
  await requireRole("admin");
  const settings = await db.getPricing();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Tarification</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ajustez les paramètres de calcul du prix. Appliqué immédiatement aux nouvelles estimations.</p>
      </div>
      <PricingEditor settings={settings} />
    </div>
  );
}

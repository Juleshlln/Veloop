import { Wallet, TrendingUp, CheckCircle2, Info } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/veloop/empty-state";
import { DRIVER_SHARE } from "@/lib/config";
import { formatDateTime, formatEuro } from "@/lib/utils";

export const metadata = { title: "Mes gains" };

export default async function GainsPage() {
  const user = await requireRole("driver");
  const rides = await db.listRidesForDriver(user.id);
  const completed = rides.filter((r) => r.status === "trip_completed");

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);

  const share = (price: number | null) => (price ?? 0) * DRIVER_SHARE;
  const total = completed.reduce((s, r) => s + share(r.final_price), 0);
  const today = completed.filter((r) => new Date(r.updated_at) >= startOfDay).reduce((s, r) => s + share(r.final_price), 0);
  const week = completed.filter((r) => new Date(r.updated_at) >= startOfWeek).reduce((s, r) => s + share(r.final_price), 0);
  const avg = completed.length ? total / completed.length : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mes gains</h1>

      <Card className="bg-gradient-to-br from-primary to-[#0a6650] p-6 text-primary-foreground">
        <p className="text-sm text-primary-foreground/80">Total estimé (à reverser)</p>
        <p className="mt-1 text-4xl font-extrabold">{formatEuro(total)}</p>
        <p className="mt-1 text-xs text-primary-foreground/70">{completed.length} course{completed.length > 1 ? "s" : ""} terminée{completed.length > 1 ? "s" : ""}</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Wallet} label="Aujourd'hui" value={formatEuro(today)} />
        <Stat icon={TrendingUp} label="Cette semaine" value={formatEuro(week)} />
        <Stat icon={CheckCircle2} label="Par course" value={formatEuro(avg)} />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-subtle p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Rémunération estimée à {Math.round(DRIVER_SHARE * 100)} % de la course. Les versements réels via
          Stripe Connect seront activés lors du lancement commercial.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-bold text-foreground">Détail</h2>
        {completed.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucun gain pour le moment" description="Terminez des courses pour voir vos gains ici." />
        ) : (
          <div className="space-y-2">
            {completed.map((r) => (
              <Card key={r.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.destination_address}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.updated_at)}</p>
                </div>
                <span className="font-bold text-foreground">{formatEuro(share(r.final_price))}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <Card className="flex flex-col items-start gap-1.5 p-4">
      <Icon className="size-5 text-primary" />
      <p className="text-base font-extrabold leading-none text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

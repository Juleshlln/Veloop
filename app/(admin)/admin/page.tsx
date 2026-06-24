import Link from "next/link";
import { Route, CheckCircle2, XCircle, Euro, ShoppingBag, Users, BadgeCheck, Wifi, ShieldAlert, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { RideStatusBadge } from "@/components/veloop/ride-status-badge";
import { AutoRefresher } from "@/components/veloop/auto-refresher";
import { formatEuro, formatRelative } from "@/lib/utils";

export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  await requireRole("admin");
  const [stats, rides] = await Promise.all([db.getAdminStats(), db.listAllRides()]);
  const recent = rides.slice(0, 8);

  const KPIS = [
    { icon: Route, label: "Courses aujourd'hui", value: `${stats.ridesToday}`, tone: "text-primary" },
    { icon: CheckCircle2, label: "Courses terminées", value: `${stats.ridesCompleted}`, tone: "text-success" },
    { icon: XCircle, label: "Annulées (jour)", value: `${stats.ridesCancelledToday}`, tone: "text-destructive" },
    { icon: Euro, label: "Chiffre d'affaires", value: formatEuro(stats.revenue), tone: "text-primary" },
    { icon: ShoppingBag, label: "Panier moyen", value: formatEuro(stats.avgBasket), tone: "text-primary" },
    { icon: Users, label: "Clients actifs", value: `${stats.activeCustomers}`, tone: "text-primary" },
    { icon: BadgeCheck, label: "Chauffeurs validés", value: `${stats.approvedDrivers}`, tone: "text-primary" },
    { icon: Wifi, label: "Chauffeurs en ligne", value: `${stats.onlineDrivers}`, tone: "text-success" },
    { icon: ShieldAlert, label: "Incidents ouverts", value: `${stats.openIncidents}`, tone: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d&apos;ensemble de l&apos;activité Veloop.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <kpi.icon className={`size-5 ${kpi.tone}`} />
            <p className="mt-2 text-2xl font-extrabold leading-none text-foreground">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-foreground">Courses récentes</h2>
          <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Toutes les courses <ArrowRight className="size-4" />
          </Link>
        </div>
        <Card className="divide-y divide-border">
          {recent.map((ride) => (
            <Link key={ride.id} href={`/admin/courses/${ride.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-subtle">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {ride.customer?.first_name} {ride.customer?.last_name?.[0]}. → {ride.destination_address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ride.driver ? `Chauffeur : ${ride.driver.first_name}` : "Sans chauffeur"} · {formatRelative(ride.created_at)}
                </p>
              </div>
              <span className="hidden text-sm font-bold text-foreground sm:inline">{formatEuro(ride.final_price ?? ride.estimated_price)}</span>
              <RideStatusBadge status={ride.status} />
            </Link>
          ))}
        </Card>
      </div>

      <AutoRefresher enabled intervalMs={6000} />
    </div>
  );
}

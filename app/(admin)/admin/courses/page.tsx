import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { AdminCoursesTable, type AdminRideRow } from "@/components/veloop/admin/admin-courses-table";
import { AutoRefresher } from "@/components/veloop/auto-refresher";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage() {
  await requireRole("admin");
  const [rides, drivers] = await Promise.all([db.listAllRides(), db.listDriverProfiles("approved")]);

  const rows: AdminRideRow[] = rides.map((r) => ({
    id: r.id,
    customerName: r.customer ? `${r.customer.first_name} ${r.customer.last_name}` : "—",
    driverName: r.driver ? `${r.driver.first_name} ${r.driver.last_name}` : null,
    driverId: r.driver_id,
    pickup: r.pickup_address,
    destination: r.destination_address,
    createdAt: r.created_at,
    amount: r.final_price ?? r.estimated_price,
    status: r.status,
  }));

  const driverOptions = drivers
    .filter((d) => d.profile)
    .map((d) => ({ id: d.user_id, name: `${d.profile!.first_name} ${d.profile!.last_name}` }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">Assignez les chauffeurs et pilotez les statuts.</p>
      </div>
      <AdminCoursesTable rides={rows} drivers={driverOptions} />
      <AutoRefresher enabled intervalMs={8000} />
    </div>
  );
}

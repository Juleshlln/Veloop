import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { VehicleManager } from "@/components/veloop/vehicle-manager";

export const metadata = { title: "Mes véhicules" };

export default async function VehiculesPage() {
  const user = await requireRole("customer");
  const vehicles = await db.listVehicles(user.id);
  return <VehicleManager vehicles={vehicles} />;
}

import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { OrderFlow } from "@/components/veloop/order-flow";

export const metadata = { title: "Nouvelle course" };

export default async function NouvelleCoursePage() {
  const user = await requireRole("customer");
  const [vehicles, savedAddresses] = await Promise.all([
    db.listVehicles(user.id),
    db.listAddresses(user.id),
  ]);

  return <OrderFlow vehicles={vehicles} savedAddresses={savedAddresses} />;
}

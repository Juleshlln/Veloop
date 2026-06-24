import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { AddressManager } from "@/components/veloop/address-manager";

export const metadata = { title: "Mes adresses" };

export default async function AdressesPage() {
  const user = await requireRole("customer");
  const addresses = await db.listAddresses(user.id);
  return <AddressManager addresses={addresses} />;
}

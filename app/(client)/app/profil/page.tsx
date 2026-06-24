import { requireRole } from "@/lib/auth/session";
import { ProfileEditor } from "@/components/veloop/profile-editor";

export const metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const user = await requireRole("customer");
  return <ProfileEditor profile={user} />;
}

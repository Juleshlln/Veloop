import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { OnboardingForm } from "@/components/veloop/driver/onboarding-form";

export const metadata = { title: "Onboarding chauffeur" };

export default async function OnboardingPage() {
  const user = await requireRole("driver");
  const driverProfile = await db.getDriverProfile(user.id);
  return <OnboardingForm driverProfile={driverProfile} />;
}

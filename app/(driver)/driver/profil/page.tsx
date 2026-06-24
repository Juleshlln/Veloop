import { Star, CheckCircle2, Bike } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { ProfileEditor } from "@/components/veloop/profile-editor";

export const metadata = { title: "Mon profil" };

export default async function DriverProfil() {
  const user = await requireRole("driver");
  const dp = await db.getDriverProfile(user.id);

  return (
    <div className="space-y-5">
      <ProfileEditor profile={user} />
      {dp && (
        <Card className="grid grid-cols-3 gap-3 p-5">
          <Metric icon={Star} label="Note" value={dp.average_rating > 0 ? dp.average_rating.toFixed(1) : "—"} />
          <Metric icon={CheckCircle2} label="Courses" value={`${dp.completed_trips}`} />
          <Metric icon={Bike} label="Vélo pliable" value={dp.folding_bike_confirmed ? "Oui" : "Non"} />
        </Card>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Icon className="size-5 text-primary" />
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

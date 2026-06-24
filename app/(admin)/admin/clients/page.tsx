import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SuspendButton } from "@/components/veloop/admin/suspend-button";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  await requireRole("admin");
  const customers = await db.listProfiles("customer");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customers.length} client(s) enregistré(s).</p>
      </div>

      <div className="space-y-2">
        {customers.map((c) => (
          <Card key={c.id} className="flex items-center gap-3 p-4">
            <Avatar firstName={c.first_name} lastName={c.last_name} className="size-11" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-foreground">{c.first_name} {c.last_name}</p>
                {c.status === "suspended" && <Badge variant="danger">Suspendu</Badge>}
              </div>
              <p className="truncate text-sm text-muted-foreground">{c.email} · {c.phone ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Inscrit le {formatDateTime(c.created_at)}</p>
            </div>
            <SuspendButton userId={c.id} suspended={c.status === "suspended"} />
          </Card>
        ))}
      </div>
    </div>
  );
}

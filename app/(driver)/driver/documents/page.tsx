import { Info } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { DocumentsList } from "@/components/veloop/driver/documents-list";

export const metadata = { title: "Mes documents" };

export default async function DocumentsPage() {
  const user = await requireRole("driver");
  const documents = await db.listDriverDocuments(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mes documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Transmettez vos documents pour la validation de votre compte.</p>
      </div>
      <DocumentsList documents={documents} />
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-subtle p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          La vérification des documents est réalisée manuellement par l&apos;équipe Veloop avant validation du compte.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ApprovalActions } from "@/components/veloop/admin/approval-actions";
import { formatDateTime } from "@/lib/utils";
import type { DocumentType, VerificationStatus } from "@/lib/types";

const DOC_LABEL: Record<DocumentType, string> = {
  permis_recto: "Permis (recto)",
  permis_verso: "Permis (verso)",
  piece_identite: "Pièce d'identité",
  justificatif_domicile: "Justificatif de domicile",
  assurance: "Assurance",
  photo_velo: "Photo vélo pliable",
};

const VERIF: Record<VerificationStatus, { variant: "success" | "warning" | "danger"; icon: typeof Clock }> = {
  approved: { variant: "success", icon: CheckCircle2 },
  pending: { variant: "warning", icon: Clock },
  rejected: { variant: "danger", icon: XCircle },
};

export default async function AdminChauffeurDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("admin");
  const [profile, dp, documents] = await Promise.all([
    db.getProfileById(id),
    db.getDriverProfile(id),
    db.listDriverDocuments(id),
  ]);
  if (!profile || !dp) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/chauffeurs" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Chauffeurs
      </Link>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar firstName={profile.first_name} lastName={profile.last_name} className="size-16 text-lg" />
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">{profile.phone ?? "—"}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <ApprovalActions userId={id} status={dp.approval_status} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-bold text-foreground">Informations</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Date de naissance" value={dp.date_of_birth ?? "—"} />
          <Field label="N° de permis" value={dp.driver_license_number ?? "—"} />
          <Field label="Expiration permis" value={dp.driver_license_expiry ?? "—"} />
          <Field label="Expérience" value={`${dp.years_of_experience} an(s)`} />
          <Field label="Vélo pliable" value={dp.folding_bike_confirmed ? "Confirmé" : "Non confirmé"} />
          <Field label="Note moyenne" value={dp.average_rating > 0 ? dp.average_rating.toFixed(1) : "—"} />
          <Field label="Courses réalisées" value={`${dp.completed_trips}`} />
          <Field label="Inscrit le" value={formatDateTime(dp.created_at)} />
        </dl>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-bold text-foreground">Documents</h2>
        <div className="space-y-2">
          {documents.map((doc) => {
            const v = VERIF[doc.verification_status];
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <FileText className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">{DOC_LABEL[doc.document_type]}</span>
                {doc.file_url ? (
                  <Badge variant={v.variant}><v.icon className="size-3" /> {doc.verification_status === "approved" ? "Validé" : doc.verification_status === "pending" ? "En attente" : "Refusé"}</Badge>
                ) : (
                  <Badge variant="neutral">Manquant</Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

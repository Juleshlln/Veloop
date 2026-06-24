"use client";

import { FileText, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import type { DriverDocument, DocumentType, VerificationStatus } from "@/lib/types";

const DOC_LABEL: Record<DocumentType, string> = {
  permis_recto: "Permis de conduire (recto)",
  permis_verso: "Permis de conduire (verso)",
  piece_identite: "Pièce d'identité",
  justificatif_domicile: "Justificatif de domicile",
  assurance: "Attestation d'assurance",
  photo_velo: "Photo du vélo pliable",
};

const ALL_TYPES: DocumentType[] = [
  "permis_recto",
  "permis_verso",
  "piece_identite",
  "justificatif_domicile",
  "assurance",
  "photo_velo",
];

const STATUS: Record<VerificationStatus, { label: string; variant: "success" | "warning" | "danger"; icon: typeof Clock }> = {
  approved: { label: "Validé", variant: "success", icon: CheckCircle2 },
  pending: { label: "En attente", variant: "warning", icon: Clock },
  rejected: { label: "Refusé", variant: "danger", icon: XCircle },
};

export function DocumentsList({ documents }: { documents: DriverDocument[] }) {
  const byType = new Map(documents.map((d) => [d.document_type, d]));

  return (
    <div className="space-y-2">
      {ALL_TYPES.map((type) => {
        const doc = byType.get(type);
        const uploaded = Boolean(doc?.file_url);
        const status = doc ? STATUS[doc.verification_status] : null;
        return (
          <Card key={type} className="flex items-center gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{DOC_LABEL[type]}</p>
              {uploaded && status ? (
                <Badge variant={status.variant} className="mt-1">
                  <status.icon className="size-3" /> {status.label}
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">Non transmis</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "Téléversement simulé", description: "Le stockage de fichiers (Supabase Storage) sera connecté en production.", tone: "info" })}
            >
              <Upload className="size-4" /> {uploaded ? "Remplacer" : "Téléverser"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

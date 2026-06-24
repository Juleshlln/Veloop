"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmationSheet } from "@/components/veloop/confirmation-sheet";
import { toast } from "@/components/ui/toaster";
import { approveDriverAction, rejectDriverAction } from "@/lib/actions/admin";
import type { ApprovalStatus } from "@/lib/types";

export function ApprovalActions({ userId, status }: { userId: string; status: ApprovalStatus }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  function approve() {
    startTransition(async () => {
      const res = await approveDriverAction(userId);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Chauffeur validé", tone: "success" }); router.refresh(); }
    });
  }

  function reject() {
    startTransition(async () => {
      const res = await rejectDriverAction(userId, reason);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Chauffeur refusé", tone: "info" }); setRejectOpen(false); router.refresh(); }
    });
  }

  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <Button size="sm" onClick={approve} disabled={pending}>
          {pending ? <Spinner className="text-current" /> : <><Check /> Valider</>}
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} disabled={pending}>
          <X /> Refuser
        </Button>
      )}

      <ConfirmationSheet
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Refuser ce chauffeur"
        description="Indiquez le motif du refus (transmis au chauffeur)."
        confirmLabel="Confirmer le refus"
        tone="destructive"
        loading={pending}
        onConfirm={reject}
      >
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif du refus…" />
      </ConfirmationSheet>
    </div>
  );
}

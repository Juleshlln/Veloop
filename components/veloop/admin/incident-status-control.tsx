"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { updateIncidentStatusAction } from "@/lib/actions/admin";
import type { IncidentStatus } from "@/lib/types";

export function IncidentStatusControl({ id, status }: { id: string; status: IncidentStatus }) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();

  function change(next: IncidentStatus) {
    startTransition(async () => {
      const res = await updateIncidentStatusAction(id, next);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Incident mis à jour", tone: "success" }); router.refresh(); }
    });
  }

  return (
    <Select value={status} onChange={(e) => change(e.target.value as IncidentStatus)} className="h-10 w-auto text-sm">
      <option value="open">Ouvert</option>
      <option value="investigating">En cours</option>
      <option value="resolved">Résolu</option>
    </Select>
  );
}

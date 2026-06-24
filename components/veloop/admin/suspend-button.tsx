"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { suspendUserAction } from "@/lib/actions/admin";

export function SuspendButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await suspendUserAction(userId, !suspended);
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: suspended ? "Compte réactivé" : "Compte suspendu", tone: suspended ? "success" : "info" }); router.refresh(); }
    });
  }

  return (
    <Button size="sm" variant={suspended ? "outline" : "ghost"} onClick={toggle} disabled={pending} className={suspended ? "" : "text-destructive"}>
      {suspended ? <><RotateCcw /> Réactiver</> : <><Ban /> Suspendre</>}
    </Button>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { toggleOnlineAction } from "@/lib/actions/driver";
import { cn } from "@/lib/utils";

export function OnlineToggle({ online, approved }: { online: boolean; approved: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(online);

  function toggle(next: boolean) {
    if (!approved) {
      toast({ title: "Compte non validé", description: "Votre profil doit être validé pour passer en ligne.", tone: "warning" });
      return;
    }
    setValue(next);
    startTransition(async () => {
      const res = await toggleOnlineAction(next);
      if (res.error) {
        setValue(!next);
        toast({ title: res.error, tone: "error" });
      } else {
        toast({ title: next ? "Vous êtes en ligne" : "Vous êtes hors ligne", tone: next ? "success" : "info" });
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border p-5 transition-colors",
        value ? "border-primary/30 bg-primary-soft/50" : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("flex size-3 items-center justify-center")}>
          <span className={cn("size-3 rounded-full", value ? "bg-success" : "bg-muted-foreground/40")} />
        </span>
        <div>
          <p className="font-bold text-foreground">{value ? "En ligne" : "Hors ligne"}</p>
          <p className="text-sm text-muted-foreground">
            {value ? "Vous pouvez recevoir des courses" : "Activez pour recevoir des courses"}
          </p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={toggle} disabled={pending} aria-label="Disponibilité" />
    </div>
  );
}

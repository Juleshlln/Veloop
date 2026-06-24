"use client";

import * as React from "react";
import { ShieldAlert, Phone, Share2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationSheet } from "./confirmation-sheet";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface EmergencyButtonProps {
  rideId?: string;
  className?: string;
  variant?: "fab" | "inline";
}

/** Always-accessible safety action. Demo: shows safety options, no real dispatch. */
export function EmergencyButton({ rideId, className, variant = "fab" }: EmergencyButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {variant === "fab" ? (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-[#f6d4d9] bg-[#fdeaed] px-4 py-2 text-sm font-bold text-destructive shadow-sm active:scale-95",
            className,
          )}
        >
          <ShieldAlert className="size-4" /> Urgence
        </button>
      ) : (
        <Button variant="destructive" className={className} onClick={() => setOpen(true)}>
          <ShieldAlert /> Urgence
        </Button>
      )}

      <ConfirmationSheet
        open={open}
        onOpenChange={setOpen}
        title="Sécurité & urgence"
        description="En cas de danger immédiat, contactez les services d'urgence."
        hideActions
      >
        <div className="space-y-2">
          <a
            href="tel:112"
            className="flex items-center gap-3 rounded-xl border border-[#f6d4d9] bg-[#fdeaed] p-4 text-destructive"
          >
            <Phone className="size-5" />
            <div>
              <p className="font-bold">Appeler le 112</p>
              <p className="text-sm text-destructive/80">Numéro d'urgence européen</p>
            </div>
          </a>
          <button
            onClick={() => {
              toast({ title: "Trajet partagé", description: "Un lien de suivi a été préparé (démo).", tone: "success" });
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left"
          >
            <Share2 className="size-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Partager mon trajet</p>
              <p className="text-sm text-muted-foreground">Envoyer ma position à un proche</p>
            </div>
          </button>
          <button
            onClick={() => {
              toast({ title: "Signalement", description: rideId ? "Ouvrez la course pour signaler un incident détaillé." : "Contactez le support.", tone: "info" });
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left"
          >
            <Flag className="size-5 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Signaler un incident</p>
              <p className="text-sm text-muted-foreground">Problème de sécurité ou de comportement</p>
            </div>
          </button>
        </div>
      </ConfirmationSheet>
    </>
  );
}

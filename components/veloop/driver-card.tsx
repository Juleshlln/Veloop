"use client";

import { Bike, Phone, MessageSquare, Star, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { DriverProfile, Profile } from "@/lib/types";

interface DriverCardProps {
  driver: Pick<Profile, "first_name" | "last_name" | "avatar_url" | "phone">;
  driverProfile?: Pick<DriverProfile, "average_rating" | "completed_trips">;
  etaMinutes?: number;
  showContact?: boolean;
}

export function DriverCard({ driver, driverProfile, etaMinutes, showContact = true }: DriverCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar firstName={driver.first_name} lastName={driver.last_name} src={driver.avatar_url} className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-foreground">{driver.first_name}</p>
            <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Chauffeur vérifié" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            {driverProfile && driverProfile.average_rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {driverProfile.average_rating.toFixed(1)}
              </span>
            )}
            {driverProfile && (
              <span>{driverProfile.completed_trips} course{driverProfile.completed_trips > 1 ? "s" : ""}</span>
            )}
            <span className="inline-flex items-center gap-1 text-primary">
              <Bike className="size-3.5" />
              Vélo pliable
            </span>
          </div>
        </div>
        {etaMinutes != null && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Arrivée</p>
            <p className="text-lg font-extrabold text-foreground">{etaMinutes} min</p>
          </div>
        )}
      </div>

      {showContact && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (driver.phone) window.location.href = `tel:${driver.phone.replace(/\s/g, "")}`;
              else toast({ title: "Appel indisponible", tone: "info" });
            }}
          >
            <Phone /> Appeler
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast({ title: "Messagerie", description: "La messagerie temps réel arrive bientôt.", tone: "info" })}
          >
            <MessageSquare /> Message
          </Button>
        </div>
      )}
    </div>
  );
}

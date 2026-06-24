"use client";

import * as React from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { reportIncidentAction } from "@/lib/actions/account";
import type { IncidentType } from "@/lib/types";

const TYPES: { value: IncidentType; label: string }[] = [
  { value: "vehicle", label: "Problème de véhicule" },
  { value: "safety", label: "Sécurité" },
  { value: "payment", label: "Paiement" },
  { value: "behaviour", label: "Comportement" },
  { value: "other", label: "Autre" },
];

export function SupportForm({ rideId }: { rideId?: string }) {
  const [type, setType] = React.useState<IncidentType>("other");
  const [description, setDescription] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const res = await reportIncidentAction({ rideId: rideId ?? null, type, description, priority: "medium" });
      if (res.error) toast({ title: res.error, tone: "error" });
      else {
        setDone(true);
        setDescription("");
        toast({ title: "Message envoyé", description: "Notre équipe vous répondra rapidement.", tone: "success" });
      }
    });
  }

  if (done) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <h3 className="font-bold text-foreground">Message envoyé</h3>
        <p className="text-sm text-muted-foreground">Votre demande a été transmise à notre équipe support.</p>
        <Button variant="outline" onClick={() => setDone(false)}>Envoyer un autre message</Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="space-y-1.5">
        <Label htmlFor="type">Type de demande</Label>
        <Select id="type" value={type} onChange={(e) => setType(e.target.value as IncidentType)}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desc">Votre message</Label>
        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre demande ou le problème rencontré…" className="min-h-[120px]" />
      </div>
      <Button onClick={submit} disabled={pending || description.trim().length < 5} size="lg" className="w-full">
        {pending ? <Spinner className="text-current" /> : <><Send /> Envoyer</>}
      </Button>
    </Card>
  );
}

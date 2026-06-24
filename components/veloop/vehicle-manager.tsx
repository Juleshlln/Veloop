"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ConfirmationSheet } from "./confirmation-sheet";
import { EmptyState } from "./empty-state";
import { toast } from "@/components/ui/toaster";
import { addVehicleAction, deleteVehicleAction } from "@/lib/actions/account";
import type { CustomerVehicle, TransmissionType, VehicleType } from "@/lib/types";

const TYPES: { value: VehicleType; label: string }[] = [
  { value: "citadine", label: "Citadine" },
  { value: "berline", label: "Berline" },
  { value: "break", label: "Break" },
  { value: "suv", label: "SUV" },
  { value: "monospace", label: "Monospace" },
  { value: "utilitaire", label: "Utilitaire" },
];

const EMPTY = {
  brand: "",
  model: "",
  registration_number: "",
  color: "",
  vehicle_type: "citadine" as VehicleType,
  transmission_type: "manuelle" as TransmissionType,
  notes: "",
};

export function VehicleManager({ vehicles }: { vehicles: CustomerVehicle[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const res = await addVehicleAction(form);
      if (res.error) toast({ title: res.error, tone: "error" });
      else {
        toast({ title: "Véhicule ajouté", tone: "success" });
        setForm(EMPTY);
        setOpen(false);
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteVehicleAction(id);
      toast({ title: "Véhicule supprimé", tone: "info" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mes véhicules</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus /> Ajouter</Button>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Aucun véhicule enregistré"
          description="Ajoutez la voiture avec laquelle vous souhaitez rentrer."
          action={<Button onClick={() => setOpen(true)}><Plus /> Ajouter un véhicule</Button>}
        />
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Car className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{v.brand} {v.model}</p>
                <p className="truncate text-sm text-muted-foreground">{v.color} · {v.registration_number} · {v.transmission_type}</p>
              </div>
              <button onClick={() => remove(v.id)} disabled={pending} className="rounded-full p-2 text-muted-foreground hover:bg-subtle hover:text-destructive" aria-label="Supprimer">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmationSheet
        open={open}
        onOpenChange={setOpen}
        title="Ajouter un véhicule"
        confirmLabel="Enregistrer"
        loading={pending}
        onConfirm={submit}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marque"><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Peugeot" /></Field>
            <Field label="Modèle"><Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="308" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Immatriculation"><Input value={form.registration_number} onChange={(e) => set("registration_number", e.target.value)} placeholder="FA-123-BC" /></Field>
            <Field label="Couleur"><Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Gris" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value as VehicleType)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Boîte">
              <Select value={form.transmission_type} onChange={(e) => set("transmission_type", e.target.value as TransmissionType)}>
                <option value="manuelle">Manuelle</option>
                <option value="automatique">Automatique</option>
              </Select>
            </Field>
          </div>
        </div>
      </ConfirmationSheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

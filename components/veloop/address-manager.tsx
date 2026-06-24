"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationSheet } from "./confirmation-sheet";
import { AddressAutocomplete } from "./address-autocomplete";
import { EmptyState } from "./empty-state";
import { toast } from "@/components/ui/toaster";
import { addAddressAction, deleteAddressAction } from "@/lib/actions/account";
import type { SavedAddress } from "@/lib/types";
import type { GeoPlace } from "@/lib/geo";

export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [place, setPlace] = React.useState<GeoPlace | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit() {
    if (!label.trim()) return toast({ title: "Donnez un libellé à l'adresse.", tone: "error" });
    if (!place) return toast({ title: "Sélectionnez une adresse.", tone: "error" });
    startTransition(async () => {
      const res = await addAddressAction({ label, address: place.address, lat: place.coordinates.lat, lng: place.coordinates.lng });
      if (res.error) toast({ title: res.error, tone: "error" });
      else {
        toast({ title: "Adresse enregistrée", tone: "success" });
        setLabel(""); setPlace(null); setOpen(false);
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteAddressAction(id);
      toast({ title: "Adresse supprimée", tone: "info" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mes adresses</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus /> Ajouter</Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Aucune adresse favorite"
          description="Enregistrez vos lieux fréquents pour commander plus vite."
          action={<Button onClick={() => setOpen(true)}><Plus /> Ajouter une adresse</Button>}
        />
      ) : (
        <div className="space-y-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{a.label}</p>
                <p className="truncate text-sm text-muted-foreground">{a.address}</p>
              </div>
              <button onClick={() => remove(a.id)} disabled={pending} className="rounded-full p-2 text-muted-foreground hover:bg-subtle hover:text-destructive" aria-label="Supprimer">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmationSheet open={open} onOpenChange={setOpen} title="Ajouter une adresse" confirmLabel="Enregistrer" loading={pending} onConfirm={submit}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="addr-label">Libellé</Label>
            <Input id="addr-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Domicile, Travail…" />
          </div>
          <AddressAutocomplete label="Adresse" value={place} onChange={setPlace} placeholder="Rechercher une adresse" />
        </div>
      </ConfirmationSheet>
    </div>
  );
}

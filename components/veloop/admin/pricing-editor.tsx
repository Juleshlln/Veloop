"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PriceBreakdown } from "@/components/veloop/price-breakdown";
import { toast } from "@/components/ui/toaster";
import { updatePricingAction } from "@/lib/actions/admin";
import { computePrice } from "@/lib/pricing";
import type { PricingSettings } from "@/lib/types";

const FIELDS: { key: keyof PricingSettings; label: string; step: string; suffix: string }[] = [
  { key: "base_fee", label: "Prise en charge", step: "0.5", suffix: "€" },
  { key: "price_per_km", label: "Prix au kilomètre", step: "0.1", suffix: "€/km" },
  { key: "price_per_minute", label: "Prix à la minute", step: "0.05", suffix: "€/min" },
  { key: "minimum_price", label: "Prix minimum", step: "1", suffix: "€" },
  { key: "night_multiplier", label: "Majoration nocturne", step: "0.05", suffix: "×" },
  { key: "surge_multiplier", label: "Forte demande", step: "0.05", suffix: "×" },
];

export function PricingEditor({ settings }: { settings: PricingSettings }) {
  const router = useRouter();
  const [values, setValues] = React.useState(settings);
  const [pending, startTransition] = React.useTransition();

  function set(key: keyof PricingSettings, value: number) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const preview = computePrice({
    distanceKm: 8,
    durationMin: 24,
    settings: values,
    when: new Date("2026-01-01T15:00:00"),
  });

  function save() {
    startTransition(async () => {
      const res = await updatePricingAction({
        base_fee: values.base_fee,
        price_per_km: values.price_per_km,
        price_per_minute: values.price_per_minute,
        minimum_price: values.minimum_price,
        night_multiplier: values.night_multiplier,
        surge_multiplier: values.surge_multiplier,
      });
      if (res.error) toast({ title: res.error, tone: "error" });
      else { toast({ title: "Tarification enregistrée", tone: "success" }); router.refresh(); }
    });
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="space-y-4 p-5">
        <h2 className="font-bold text-foreground">Paramètres</h2>
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            <div className="relative">
              <Input
                id={f.key}
                type="number"
                step={f.step}
                min={f.key.includes("multiplier") ? 1 : 0}
                value={String(values[f.key] as number)}
                onChange={(e) => set(f.key, Number(e.target.value))}
                className="pr-16"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.suffix}</span>
            </div>
          </div>
        ))}
        <Button size="lg" className="w-full" onClick={save} disabled={pending}>
          {pending ? <Spinner className="text-current" /> : <><Save /> Enregistrer</>}
        </Button>
      </Card>

      <Card className="h-fit p-5">
        <h2 className="font-bold text-foreground">Aperçu en direct</h2>
        <p className="mt-1 text-sm text-muted-foreground">Course type · 8 km / 24 min (tarif de jour).</p>
        <div className="mt-4">
          <PriceBreakdown breakdown={preview} estimate={false} />
        </div>
      </Card>
    </div>
  );
}

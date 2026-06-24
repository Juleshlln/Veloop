import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/veloop/page-hero";
import { PriceBreakdown } from "@/components/veloop/price-breakdown";
import { computePrice, DEFAULT_PRICING } from "@/lib/pricing";
import { formatEuro } from "@/lib/utils";

export const metadata = { title: "Tarifs" };

export default function Page() {
  // Sample course (~8 km, ~24 min) — illustrates the pricing formula.
  const sample = computePrice({
    distanceKm: 8,
    durationMin: 24,
    settings: DEFAULT_PRICING,
    when: new Date("2026-01-01T15:00:00"),
  });

  const PARAMS = [
    { label: "Frais de prise en charge", value: formatEuro(DEFAULT_PRICING.base_fee) },
    { label: "Prix au kilomètre", value: `${formatEuro(DEFAULT_PRICING.price_per_km)} / km` },
    { label: "Prix à la minute", value: `${formatEuro(DEFAULT_PRICING.price_per_minute)} / min` },
    { label: "Prix minimum", value: formatEuro(DEFAULT_PRICING.minimum_price) },
    { label: "Majoration nocturne (22 h – 6 h)", value: `×${DEFAULT_PRICING.night_multiplier.toFixed(2)}` },
    { label: "Majoration forte demande", value: "Désactivée par défaut" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Tarification"
        title="Un prix clair, sans surprise"
        subtitle="Le prix est calculé à partir de la prise en charge, de la distance et de la durée. Le montant final est confirmé à la fin de la course."
      />
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Paramètres de tarification</h2>
          <dl className="mt-4 divide-y divide-border">
            {PARAMS.map((p) => (
              <div key={p.label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-muted-foreground">{p.label}</dt>
                <dd className="text-sm font-semibold text-foreground">{p.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Tarifs indicatifs du MVP, ajustables depuis le tableau de bord administrateur.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Exemple de course</h2>
          <p className="mt-1 text-sm text-muted-foreground">Trajet d&apos;environ 8 km en 24 minutes.</p>
          <div className="mt-5">
            <PriceBreakdown breakdown={sample} estimate />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 pb-14 text-center sm:px-6">
        <Button asChild size="lg">
          <Link href="/app/nouvelle-course">Obtenir une estimation <ArrowRight /></Link>
        </Button>
      </div>
    </>
  );
}

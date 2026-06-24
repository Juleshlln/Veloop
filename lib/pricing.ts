import type { PricingSettings } from "./types";

/* ============================================================
   Veloop — Pricing engine (single source of truth)
   prix = prise en charge + (km × tarif/km) + (min × tarif/min)
   puis prix minimum, majoration nocturne, forte demande, promo.
   Meant to run server-side. Never trust a price computed in the client.
   ============================================================ */

export const DEFAULT_PRICING: PricingSettings = {
  id: "default",
  base_fee: 15,
  price_per_km: 1.5,
  price_per_minute: 0.35,
  minimum_price: 29,
  night_multiplier: 1.2,
  surge_multiplier: 1.0,
  updated_at: new Date(0).toISOString(),
};

export interface PriceLine {
  label: string;
  amount: number;
  hint?: string;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  subtotal: number;
  total: number;
  currency: "EUR";
  /** True when the minimum fare was applied. */
  minimumApplied: boolean;
  nightApplied: boolean;
  surgeApplied: boolean;
  promoCode?: string;
  promoAmount?: number;
}

export interface PriceInput {
  distanceKm: number;
  durationMin: number;
  settings?: PricingSettings;
  /** Pickup time — used to decide the night multiplier. Defaults to now. */
  when?: Date;
  promoCode?: string | null;
}

/** Night hours: 22:00 → 06:00. */
function isNight(date: Date): boolean {
  const h = date.getHours();
  return h >= 22 || h < 6;
}

/** Demo promo codes. Replace with a DB-backed table later. */
const PROMO_CODES: Record<string, { type: "percent" | "flat"; value: number }> = {
  VELOOP10: { type: "percent", value: 10 },
  BIENVENUE: { type: "flat", value: 5 },
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computePrice(input: PriceInput): PriceBreakdown {
  const settings = input.settings ?? DEFAULT_PRICING;
  const when = input.when ?? new Date();
  const distanceKm = Math.max(0, input.distanceKm);
  const durationMin = Math.max(0, input.durationMin);

  const distanceCost = round2(distanceKm * settings.price_per_km);
  const durationCost = round2(durationMin * settings.price_per_minute);

  const lines: PriceLine[] = [
    { label: "Prise en charge", amount: round2(settings.base_fee) },
    {
      label: "Distance",
      amount: distanceCost,
      hint: `${distanceKm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km × ${settings.price_per_km.toFixed(2)} €`,
    },
    {
      label: "Durée",
      amount: durationCost,
      hint: `${Math.round(durationMin)} min × ${settings.price_per_minute.toFixed(2)} €`,
    },
  ];

  let total = settings.base_fee + distanceCost + durationCost;
  const subtotal = round2(total);

  const nightApplied = isNight(when) && settings.night_multiplier > 1;
  if (nightApplied) {
    const before = total;
    total *= settings.night_multiplier;
    lines.push({
      label: "Majoration nocturne",
      amount: round2(total - before),
      hint: `×${settings.night_multiplier.toFixed(2)} (22 h – 6 h)`,
    });
  }

  const surgeApplied = settings.surge_multiplier > 1;
  if (surgeApplied) {
    const before = total;
    total *= settings.surge_multiplier;
    lines.push({
      label: "Forte demande",
      amount: round2(total - before),
      hint: `×${settings.surge_multiplier.toFixed(2)}`,
    });
  }

  let minimumApplied = false;
  if (total < settings.minimum_price) {
    lines.push({
      label: "Ajustement prix minimum",
      amount: round2(settings.minimum_price - total),
      hint: `Minimum ${settings.minimum_price.toFixed(2)} €`,
    });
    total = settings.minimum_price;
    minimumApplied = true;
  }

  let promoAmount: number | undefined;
  let promoCode: string | undefined;
  const code = input.promoCode?.trim().toUpperCase();
  if (code && PROMO_CODES[code]) {
    const promo = PROMO_CODES[code];
    const discount =
      promo.type === "percent" ? (total * promo.value) / 100 : promo.value;
    promoAmount = round2(Math.min(discount, total));
    promoCode = code;
    lines.push({
      label: `Code promo ${code}`,
      amount: -promoAmount,
      hint: promo.type === "percent" ? `-${promo.value}%` : `-${promo.value} €`,
    });
    total -= promoAmount;
  }

  return {
    lines,
    subtotal,
    total: round2(Math.max(0, total)),
    currency: "EUR",
    minimumApplied,
    nightApplied,
    surgeApplied,
    promoCode,
    promoAmount,
  };
}

export function isValidPromoCode(code: string): boolean {
  return Boolean(PROMO_CODES[code.trim().toUpperCase()]);
}

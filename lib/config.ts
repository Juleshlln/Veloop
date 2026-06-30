/**
 * Central config & feature detection.
 *
 * Veloop runs in "demo mode" whenever the relevant API keys are absent.
 * In demo mode: auth is cookie-based, data lives in an in-memory store,
 * Stripe & Mapbox are simulated. The app stays fully navigable with zero keys.
 */

function has(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    enabled:
      has(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },

  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    enabled: has(process.env.STRIPE_SECRET_KEY),
  },

  mapbox: {
    token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    enabled: has(process.env.NEXT_PUBLIC_MAPBOX_TOKEN),
  },
} as const;

/** True when no real backend is wired — the whole app runs on simulated data. */
export const IS_DEMO = !config.supabase.enabled;

/**
 * Whether to expose the one-click demo login on the auth pages.
 * Always on in demo mode; in Supabase mode it must be opted into explicitly
 * (NEXT_PUBLIC_SHOW_DEMO_LOGIN=true) so production never exposes demo creds.
 */
export const SHOW_DEMO_LOGIN = IS_DEMO || process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true";

/** Share of the fare paid to the driver (Stripe Connect-ready later). */
export const DRIVER_SHARE = 0.75;

/** Launch zone for the MVP. */
export const LAUNCH_ZONE = {
  name: "Lille & Métropole Européenne de Lille",
  center: { lat: 50.6292, lng: 3.0573 },
  radiusKm: 20,
} as const;

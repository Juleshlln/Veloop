import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

/**
 * Supabase clients for when a real backend is wired (config.supabase.enabled).
 * The app currently runs on the in-memory demo store; these helpers exist so
 * the data layer can be swapped to Supabase without restructuring callers.
 */

/** Request-scoped client bound to the user's auth cookies (respects RLS). */
export async function getSupabaseServerClient() {
  if (!config.supabase.enabled) throw new Error("Supabase non configuré.");
  const cookieStore = await cookies();
  return createServerClient(config.supabase.url!, config.supabase.anonKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a Server Component — safe to ignore
        }
      },
    },
  });
}

/** Service-role client for trusted server mutations (bypasses RLS). */
export function getSupabaseServiceClient() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant.");
  }
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

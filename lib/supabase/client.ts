"use client";

import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

/** Browser Supabase client (used once a real backend is wired). */
export function getSupabaseBrowserClient() {
  if (!config.supabase.enabled) throw new Error("Supabase non configuré.");
  return createBrowserClient(config.supabase.url!, config.supabase.anonKey!);
}

import "server-only";
import { config } from "@/lib/config";
import { demoDb, type Db } from "./demo-store";
import { supabaseDb } from "./supabase-store";

/**
 * Data layer entry point. Resolves to the real Supabase-backed repository
 * when Supabase is configured, otherwise the in-memory demo store.
 * Both implementations expose the exact same async API (`Db`).
 */
export const db: Db = config.supabase.enabled ? supabaseDb : demoDb;

export type { Db };

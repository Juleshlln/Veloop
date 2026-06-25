import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/data/store";
import { config } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export const SESSION_COOKIE = "veloop_session";

/** Resolve the current signed-in profile, from Supabase Auth or the demo cookie. */
export async function getSession(): Promise<Profile | null> {
  let userId: string | undefined;

  if (config.supabase.enabled) {
    const sb = await getSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    userId = user?.id;
  } else {
    const store = await cookies();
    userId = store.get(SESSION_COOKIE)?.value;
  }

  if (!userId) return null;
  const profile = await db.getProfileById(userId);
  if (!profile || profile.status === "suspended") return null;
  return profile;
}

/** Home route for a given role. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "driver":
      return "/driver";
    case "admin":
      return "/admin";
    default:
      return "/app";
  }
}

/** Require any signed-in user; redirect to /connexion otherwise. */
export async function requireUser(returnTo?: string): Promise<Profile> {
  const profile = await getSession();
  if (!profile) {
    redirect(`/connexion${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  }
  return profile;
}

/** Require a specific role; redirect to that role's home if mismatched. */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== role) {
    redirect(homeForRole(profile.role));
  }
  return profile;
}

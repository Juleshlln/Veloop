import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/data/store";
import type { Profile, UserRole } from "@/lib/types";

export const SESSION_COOKIE = "veloop_session";

/** Resolve the current signed-in profile from the session cookie, or null. */
export async function getSession(): Promise<Profile | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
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

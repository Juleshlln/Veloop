"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/data/store";
import { config } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SESSION_COOKIE, homeForRole, getSession } from "./session";
import type { UserRole } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production",
};

async function setDemoSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, COOKIE_OPTS);
}

function redirectByRole(role: UserRole, next?: string): never {
  redirect(next && next.startsWith("/") ? next : homeForRole(role));
}

const signInSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
  next: z.string().optional(),
});

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { email, password, next } = parsed.data;

  if (config.supabase.enabled) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: "E-mail ou mot de passe incorrect." };
    const profile = await db.getProfileById(data.user.id);
    if (!profile) return { error: "Profil introuvable." };
    if (profile.status === "suspended") return { error: "Ce compte est suspendu. Contactez le support." };
    return redirectByRole(profile.role, next);
  }

  const profile = await db.verifyCredentials(email, password);
  if (!profile) return { error: "E-mail ou mot de passe incorrect." };
  if (profile.status === "suspended") return { error: "Ce compte est suspendu. Contactez le support." };
  await setDemoSession(profile.id);
  return redirectByRole(profile.role, next);
}

const signUpSchema = z.object({
  role: z.enum(["customer", "driver"]),
  firstName: z.string().min(1, "Prénom requis."),
  lastName: z.string().min(1, "Nom requis."),
  email: z.string().email("Adresse e-mail invalide."),
  phone: z.string().optional(),
  password: z.string().min(6, "6 caractères minimum."),
});

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { role, firstName, lastName, email, phone, password } = parsed.data;

  if (config.supabase.enabled) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { role, first_name: firstName, last_name: lastName, phone: phone ?? null } },
    });
    if (error) {
      return { error: error.message.includes("already") ? "Un compte existe déjà avec cette adresse e-mail." : error.message };
    }
    if (!data.session) {
      // Email confirmation is enabled on the project.
      return { error: "Compte créé. Vérifiez votre e-mail pour confirmer votre inscription, puis connectez-vous." };
    }
    return redirect(role === "driver" ? "/driver/onboarding" : "/app");
  }

  try {
    const profile = await db.createUser({ role, firstName, lastName, email, phone, password });
    await setDemoSession(profile.id);
    return redirect(role === "driver" ? "/driver/onboarding" : "/app");
  } catch (err) {
    if (err instanceof Error && err.message.includes("existe déjà")) return { error: err.message };
    throw err;
  }
}

export async function signOutAction(): Promise<void> {
  if (config.supabase.enabled) {
    const sb = await getSupabaseServerClient();
    await sb.auth.signOut();
  } else {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }
  redirect("/");
}

/** One-click sign-in for the seeded demo accounts (works in both modes). */
export async function demoSignInAction(role: "customer" | "driver" | "admin"): Promise<ActionResult> {
  const email = role === "customer" ? "client@veloop.fr" : role === "driver" ? "chauffeur@veloop.fr" : "admin@veloop.fr";

  if (config.supabase.enabled) {
    const sb = await getSupabaseServerClient();
    const { error } = await sb.auth.signInWithPassword({ email, password: "veloop123" });
    if (error) return { error: "Connexion démo impossible." };
    return redirectByRole(role);
  }

  const profile = await db.getProfileByEmail(email);
  if (!profile) return { error: "Compte de démonstration introuvable." };
  await setDemoSession(profile.id);
  return redirectByRole(profile.role);
}

export async function currentUserId(): Promise<string | null> {
  const profile = await getSession();
  return profile?.id ?? null;
}

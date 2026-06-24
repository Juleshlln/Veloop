"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/data/store";
import { SESSION_COOKIE, homeForRole, getSession } from "./session";

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

async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, COOKIE_OPTS);
}

const signInSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
  next: z.string().optional(),
});

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { email, password, next } = parsed.data;
  const profile = await db.verifyCredentials(email, password);
  if (!profile) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  if (profile.status === "suspended") {
    return { error: "Ce compte est suspendu. Contactez le support." };
  }
  await setSession(profile.id);
  redirect(next && next.startsWith("/") ? next : homeForRole(profile.role));
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
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  try {
    const profile = await db.createUser(parsed.data);
    await setSession(profile.id);
    redirect(profile.role === "driver" ? "/driver/onboarding" : "/app");
  } catch (err) {
    if (err instanceof Error && err.message.includes("existe déjà")) {
      return { error: err.message };
    }
    throw err;
  }
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}

/** Demo helper: one-click sign-in for the seeded accounts. */
export async function demoSignInAction(role: "customer" | "driver" | "admin"): Promise<ActionResult> {
  const email =
    role === "customer" ? "client@veloop.fr" : role === "driver" ? "chauffeur@veloop.fr" : "admin@veloop.fr";
  const profile = await db.getProfileByEmail(email);
  if (!profile) return { error: "Compte de démonstration introuvable." };
  await setSession(profile.id);
  redirect(homeForRole(profile.role));
}

/** Used by client components to read the current session id quickly. */
export async function currentUserId(): Promise<string | null> {
  const profile = await getSession();
  return profile?.id ?? null;
}

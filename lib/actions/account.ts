"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/data/store";
import { requireUser, requireRole } from "@/lib/auth/session";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

/* ---------------- Profile ---------------- */
const profileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis."),
  lastName: z.string().min(1, "Nom requis."),
  phone: z.string().optional(),
});

export async function updateProfileAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  await db.updateProfile(user.id, {
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    phone: parsed.data.phone || null,
  });
  revalidatePath("/app/profil");
  revalidatePath("/driver/profil");
  return { ok: true };
}

/* ---------------- Vehicles ---------------- */
const vehicleSchema = z.object({
  brand: z.string().min(1, "Marque requise."),
  model: z.string().min(1, "Modèle requis."),
  registration_number: z.string().min(1, "Immatriculation requise."),
  color: z.string().min(1, "Couleur requise."),
  vehicle_type: z.enum(["berline", "citadine", "suv", "break", "monospace", "utilitaire"]),
  transmission_type: z.enum(["manuelle", "automatique"]),
  notes: z.string().optional(),
});

export async function addVehicleAction(input: unknown): Promise<ActionState> {
  const user = await requireRole("customer");
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  await db.addVehicle({
    customer_id: user.id,
    brand: parsed.data.brand,
    model: parsed.data.model,
    registration_number: parsed.data.registration_number.toUpperCase(),
    color: parsed.data.color,
    vehicle_type: parsed.data.vehicle_type,
    transmission_type: parsed.data.transmission_type,
    notes: parsed.data.notes || null,
  });
  revalidatePath("/app/vehicules");
  revalidatePath("/app/nouvelle-course");
  return { ok: true };
}

export async function deleteVehicleAction(vehicleId: string): Promise<ActionState> {
  const user = await requireRole("customer");
  await db.deleteVehicle(vehicleId, user.id);
  revalidatePath("/app/vehicules");
  return { ok: true };
}

/* ---------------- Saved addresses ---------------- */
const addressSchema = z.object({
  label: z.string().min(1, "Libellé requis."),
  address: z.string().min(1, "Adresse requise."),
  lat: z.number(),
  lng: z.number(),
});

export async function addAddressAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Adresse invalide." };
  await db.addAddress({
    user_id: user.id,
    label: parsed.data.label,
    address: parsed.data.address,
    latitude: parsed.data.lat,
    longitude: parsed.data.lng,
  });
  revalidatePath("/app/adresses");
  return { ok: true };
}

export async function deleteAddressAction(addressId: string): Promise<ActionState> {
  const user = await requireUser();
  await db.deleteAddress(addressId, user.id);
  revalidatePath("/app/adresses");
  return { ok: true };
}

/* ---------------- Notifications ---------------- */
export async function markNotificationsReadAction(): Promise<ActionState> {
  const user = await requireUser();
  await db.markNotificationsRead(user.id);
  revalidatePath("/app");
  revalidatePath("/driver");
  return { ok: true };
}

/* ---------------- Incidents / support ---------------- */
const incidentSchema = z.object({
  rideId: z.string().nullable().optional(),
  type: z.enum(["vehicle", "safety", "payment", "behaviour", "other"]),
  description: z.string().min(5, "Décrivez le problème (5 caractères min)."),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function reportIncidentAction(input: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = incidentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  await db.createIncident({
    rideId: parsed.data.rideId ?? null,
    reportedBy: user.id,
    type: parsed.data.type,
    description: parsed.data.description,
    priority: parsed.data.priority,
  });
  revalidatePath("/app/support");
  revalidatePath("/admin/incidents");
  return { ok: true };
}

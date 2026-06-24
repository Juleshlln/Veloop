"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/data/store";
import { requireRole } from "@/lib/auth/session";
import type { ActionState } from "./account";
import type { IncidentStatus, RideStatus } from "@/lib/types";

export async function approveDriverAction(userId: string): Promise<ActionState> {
  await requireRole("admin");
  await db.setDriverApproval(userId, "approved");
  revalidatePath("/admin/chauffeurs");
  revalidatePath(`/admin/chauffeurs/${userId}`);
  return { ok: true };
}

export async function rejectDriverAction(userId: string, reason: string): Promise<ActionState> {
  await requireRole("admin");
  if (!reason.trim()) return { error: "Indiquez un motif de refus." };
  await db.setDriverApproval(userId, "rejected", reason);
  revalidatePath("/admin/chauffeurs");
  revalidatePath(`/admin/chauffeurs/${userId}`);
  return { ok: true };
}

export async function assignDriverAction(rideId: string, driverId: string): Promise<ActionState> {
  const admin = await requireRole("admin");
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  const dp = await db.getDriverProfile(driverId);
  if (!dp || dp.approval_status !== "approved") return { error: "Chauffeur non validé." };
  await db.assignDriver(rideId, driverId, admin.id);
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${rideId}`);
  return { ok: true };
}

const statusSchema = z.enum([
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_on_the_way",
  "driver_arrived",
  "vehicle_check",
  "trip_started",
  "trip_in_progress",
  "trip_completed",
  "cancelled",
  "incident_reported",
]);

export async function setRideStatusAction(rideId: string, status: RideStatus): Promise<ActionState> {
  const admin = await requireRole("admin");
  if (!statusSchema.safeParse(status).success) return { error: "Statut invalide." };
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  if (status === "cancelled") {
    await db.cancelRide(rideId, "Annulée par l'administrateur", admin.id);
  } else {
    await db.updateRideStatus(rideId, status, admin.id);
  }
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${rideId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function suspendUserAction(userId: string, suspend: boolean): Promise<ActionState> {
  await requireRole("admin");
  await db.setProfileStatus(userId, suspend ? "suspended" : "active");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/chauffeurs");
  return { ok: true };
}

export async function updateIncidentStatusAction(id: string, status: IncidentStatus): Promise<ActionState> {
  await requireRole("admin");
  await db.updateIncidentStatus(id, status);
  revalidatePath("/admin/incidents");
  return { ok: true };
}

const pricingSchema = z.object({
  base_fee: z.number().min(0),
  price_per_km: z.number().min(0),
  price_per_minute: z.number().min(0),
  minimum_price: z.number().min(0),
  night_multiplier: z.number().min(1).max(3),
  surge_multiplier: z.number().min(1).max(3),
});

export async function updatePricingAction(input: unknown): Promise<ActionState> {
  await requireRole("admin");
  const parsed = pricingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Valeurs invalides." };
  await db.updatePricing(parsed.data);
  revalidatePath("/admin/tarification");
  return { ok: true };
}

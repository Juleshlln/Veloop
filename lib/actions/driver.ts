"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/data/store";
import { requireRole, requireUser } from "@/lib/auth/session";
import { canTransition, type RideStatus } from "@/lib/types";
import { INSPECTION_ANGLES, REQUIRED_ANGLE_TYPES, angleLabel } from "@/lib/inspection";
import type { ActionState } from "./account";

export async function toggleOnlineAction(online: boolean): Promise<ActionState> {
  const user = await requireRole("driver");
  const dp = await db.getDriverProfile(user.id);
  if (!dp) return { error: "Profil chauffeur introuvable." };
  if (dp.approval_status !== "approved") {
    return { error: "Votre compte doit être validé avant de passer en ligne." };
  }
  await db.setDriverOnline(user.id, online);
  revalidatePath("/driver");
  return { ok: true };
}

/** Publish the driver's live GPS position (called periodically from the browser). */
export async function updateDriverLocationAction(lat: number, lng: number): Promise<void> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const user = await requireRole("driver");
  await db.updateDriverProfile(user.id, { current_latitude: lat, current_longitude: lng });
}

export async function acceptRideAction(rideId: string): Promise<ActionState> {
  const user = await requireRole("driver");
  const dp = await db.getDriverProfile(user.id);
  if (!dp || dp.approval_status !== "approved") return { error: "Compte non validé." };
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  if (ride.driver_id) return { error: "Cette course a déjà été acceptée." };
  await db.assignDriver(rideId, user.id, user.id);
  if (!dp.is_online) await db.setDriverOnline(user.id, true);
  revalidatePath("/driver");
  redirect(`/driver/course/${rideId}`);
}

export async function refuseRideAction(rideId: string): Promise<ActionState> {
  await requireRole("driver");
  // MVP: refusing simply returns the ride to the pool (no penalty tracking).
  revalidatePath("/driver");
  return { ok: true };
}

export async function advanceRideStatusAction(rideId: string, next: RideStatus): Promise<ActionState> {
  const user = await requireRole("driver");
  const ride = await db.getRide(rideId);
  if (!ride || ride.driver_id !== user.id) return { error: "Action non autorisée." };
  if (!canTransition(ride.status, next)) return { error: "Transition de statut invalide." };

  // Gate: the trip can only start once BOTH parties signed the inspection.
  if (next === "trip_started") {
    const inspection = await db.getInspection(rideId);
    if (!inspection?.driver_confirmed) {
      return { error: "Signez l'état des lieux avant de démarrer." };
    }
    if (!inspection.customer_confirmed) {
      return { error: "Le client doit confirmer l'état des lieux avant le départ." };
    }
  }

  await db.updateRideStatus(rideId, next, user.id);
  revalidatePath(`/driver/course/${rideId}`);
  revalidatePath(`/app/course/${rideId}`);
  revalidatePath("/driver");
  return { ok: true };
}

/** Attach an inspection photo (data URL, compressed client-side) to a ride. */
export async function uploadInspectionPhotoAction(
  rideId: string,
  photoType: string,
  dataUrl: string,
): Promise<ActionState> {
  const user = await requireUser();
  const ride = await db.getRide(rideId);
  if (!ride || (ride.driver_id !== user.id && ride.customer_id !== user.id)) {
    return { error: "Action non autorisée." };
  }
  if (!INSPECTION_ANGLES.some((a) => a.type === photoType)) return { error: "Type de photo invalide." };
  if (!dataUrl.startsWith("data:image/jpeg;base64,") || dataUrl.length > 3_000_000) {
    return { error: "Photo invalide ou trop lourde." };
  }
  if (!ride.driver_id) return { error: "Aucun chauffeur assigné." };
  await db.addInspectionPhoto(rideId, ride.driver_id, photoType, dataUrl);
  revalidatePath(`/driver/course/${rideId}`);
  revalidatePath(`/app/course/${rideId}`);
  return { ok: true };
}

const checklistSchema = z.object({
  rideId: z.string().min(1),
  initialMileage: z
    .number({ message: "Kilométrage requis." })
    .int()
    .positive("Kilométrage requis."),
  damageNotes: z.string().max(1000).optional(),
});

export async function driverConfirmInspectionAction(input: unknown): Promise<ActionState> {
  const user = await requireRole("driver");
  const parsed = checklistSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const ride = await db.getRide(parsed.data.rideId);
  if (!ride || ride.driver_id !== user.id) return { error: "Action non autorisée." };

  // Insurance gate: the 4 exterior angles must be photographed before sign-off.
  const photos = await db.listInspectionPhotos(parsed.data.rideId);
  const taken = new Set(photos.map((p) => p.photo_type));
  const missing = REQUIRED_ANGLE_TYPES.filter((t) => !taken.has(t));
  if (missing.length > 0) {
    return { error: `Photos manquantes : ${missing.map(angleLabel).join(", ")}.` };
  }

  await db.upsertInspection(parsed.data.rideId, user.id, {
    driver_confirmed: true,
    initial_mileage: parsed.data.initialMileage,
    notes: parsed.data.damageNotes?.trim() || null,
  });
  revalidatePath(`/driver/course/${parsed.data.rideId}`);
  revalidatePath(`/app/course/${parsed.data.rideId}`);
  return { ok: true };
}

const onboardingSchema = z.object({
  dateOfBirth: z.string().min(1, "Date de naissance requise."),
  licenseNumber: z.string().min(1, "Numéro de permis requis."),
  licenseExpiry: z.string().min(1, "Date d'expiration requise."),
  yearsOfExperience: z.number().int().min(0).max(60),
  foldingBikeConfirmed: z.boolean(),
});

export async function completeOnboardingAction(input: unknown): Promise<ActionState> {
  const user = await requireRole("driver");
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  if (!parsed.data.foldingBikeConfirmed) return { error: "Vous devez confirmer disposer d'un vélo pliable." };
  await db.updateDriverProfile(user.id, {
    date_of_birth: parsed.data.dateOfBirth,
    driver_license_number: parsed.data.licenseNumber,
    driver_license_expiry: parsed.data.licenseExpiry,
    years_of_experience: parsed.data.yearsOfExperience,
    folding_bike_confirmed: parsed.data.foldingBikeConfirmed,
  });
  revalidatePath("/driver");
  redirect("/driver");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/data/store";
import { requireRole, requireUser } from "@/lib/auth/session";
import { estimateRouteReal, estimateDriverArrivalMin } from "@/lib/geo";
import { computePrice, type PriceBreakdown } from "@/lib/pricing";
import { createRidePaymentIntent } from "@/lib/payments";
import type { ActionState } from "./account";

const pointSchema = z.object({
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

const estimateSchema = z.object({
  pickup: pointSchema,
  destination: pointSchema,
  scheduledAt: z.string().nullable().optional(),
  promoCode: z.string().nullable().optional(),
});

export interface EstimateResult {
  error?: string;
  distanceKm?: number;
  durationMin?: number;
  driverArrivalMin?: number;
  breakdown?: PriceBreakdown;
}

/** Server-authoritative estimate. Never trust a price computed in the client. */
export async function estimateRideAction(input: unknown): Promise<EstimateResult> {
  await requireRole("customer");
  const parsed = estimateSchema.safeParse(input);
  if (!parsed.success) return { error: "Adresses invalides." };
  const { pickup, destination, scheduledAt, promoCode } = parsed.data;

  const route = await estimateRouteReal(
    { lat: pickup.lat, lng: pickup.lng },
    { lat: destination.lat, lng: destination.lng },
  );
  const settings = await db.getPricing();
  const breakdown = computePrice({
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    settings,
    when: scheduledAt ? new Date(scheduledAt) : new Date(),
    promoCode,
  });

  return {
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    driverArrivalMin: estimateDriverArrivalMin(2.5),
    breakdown,
  };
}

const createSchema = estimateSchema.extend({
  vehicleId: z.string().min(1, "Sélectionnez un véhicule."),
  passengerCount: z.number().int().min(1).max(7),
  notes: z.string().optional(),
});

export async function createRideAction(input: unknown): Promise<ActionState> {
  const user = await requireRole("customer");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  // Ownership check: the vehicle must belong to the customer.
  const vehicle = await db.getVehicle(parsed.data.vehicleId);
  if (!vehicle || vehicle.customer_id !== user.id) {
    return { error: "Véhicule introuvable." };
  }

  const ride = await db.createRide({
    customerId: user.id,
    vehicleId: parsed.data.vehicleId,
    pickup: parsed.data.pickup,
    destination: parsed.data.destination,
    scheduledAt: parsed.data.scheduledAt ?? null,
    passengerCount: parsed.data.passengerCount,
    notes: parsed.data.notes ?? null,
  });

  // Pre-authorize the payment for the estimated amount (demo / Stripe-ready).
  const intent = await createRidePaymentIntent(ride.id, ride.estimated_price);
  await db.upsertPayment(ride.id, user.id, ride.estimated_price, intent.status, intent.intentId);

  revalidatePath("/app");
  redirect(`/app/course/${ride.id}`);
}

export async function cancelRideAction(rideId: string, reason: string): Promise<ActionState> {
  const user = await requireUser();
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  const allowed = user.role === "admin" || ride.customer_id === user.id || ride.driver_id === user.id;
  if (!allowed) return { error: "Action non autorisée." };
  await db.cancelRide(rideId, reason || "Annulée par l'utilisateur", user.id);
  revalidatePath(`/app/course/${rideId}`);
  revalidatePath("/app");
  return { ok: true };
}

/** Customer side of the pre-trip vehicle inspection. */
export async function customerConfirmInspectionAction(rideId: string): Promise<ActionState> {
  const user = await requireRole("customer");
  const ride = await db.getRide(rideId);
  if (!ride || ride.customer_id !== user.id) return { error: "Action non autorisée." };
  if (!ride.driver_id) return { error: "Aucun chauffeur assigné." };
  // The customer signs off on the evidence, so it must exist first.
  const inspection = await db.getInspection(rideId);
  if (!inspection?.driver_confirmed) {
    return { error: "Le chauffeur doit d'abord réaliser et signer l'état des lieux." };
  }
  await db.upsertInspection(rideId, ride.driver_id, { customer_confirmed: true });
  revalidatePath(`/app/course/${rideId}`);
  revalidatePath(`/driver/course/${rideId}`);
  return { ok: true };
}

const rateSchema = z.object({
  rideId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function rateRideAction(input: unknown): Promise<ActionState> {
  const user = await requireRole("customer");
  const parsed = rateSchema.safeParse(input);
  if (!parsed.success) return { error: "Note invalide." };
  const ride = await db.getRide(parsed.data.rideId);
  if (!ride || ride.customer_id !== user.id) return { error: "Action non autorisée." };
  if (!ride.driver_id) return { error: "Aucun chauffeur à évaluer." };
  if (ride.status !== "trip_completed") return { error: "La course n'est pas terminée." };
  await db.createRating({
    ride_id: ride.id,
    customer_id: user.id,
    driver_id: ride.driver_id,
    score: parsed.data.score,
    comment: parsed.data.comment || null,
  });
  revalidatePath(`/app/course/${ride.id}`);
  revalidatePath("/app/historique");
  return { ok: true };
}

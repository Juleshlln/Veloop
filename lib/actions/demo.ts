"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/data/store";
import { requireUser } from "@/lib/auth/session";
import { SHOW_DEMO_LOGIN } from "@/lib/config";
import { RIDE_FLOW, type RideStatus } from "@/lib/types";
import type { ActionState } from "./account";

/**
 * Simulated automatic dispatch (mode "affectation automatique simulée").
 * Delegates driver selection to the data layer (an RPC in Supabase mode), so
 * the client never reads the driver pool.
 */
export async function autoDispatchAction(rideId: string): Promise<ActionState> {
  const user = await requireUser();
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  if (ride.customer_id !== user.id && user.role !== "admin") return { error: "Action non autorisée." };
  if (ride.driver_id || (ride.status !== "searching_driver" && ride.status !== "requested")) {
    return { ok: true };
  }

  try {
    const assigned = await db.autoAssignNearestDriver(rideId);
    revalidatePath(`/app/course/${rideId}`);
    if (!assigned) return { error: "Aucun chauffeur en ligne pour le moment." };
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Dispatch impossible." };
  }
}

/**
 * Demo helper: advance a ride one step along the happy path so a solo tester
 * can experience the full flow without switching accounts. Gated by the same
 * flag as the demo login so it never runs in a real production deployment.
 */
export async function demoAdvanceRideAction(rideId: string): Promise<ActionState> {
  if (!SHOW_DEMO_LOGIN) return { error: "Indisponible." };
  const user = await requireUser();
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  if (ride.customer_id !== user.id && user.role !== "admin" && ride.driver_id !== user.id) {
    return { error: "Action non autorisée." };
  }

  const idx = RIDE_FLOW.indexOf(ride.status);
  if (idx < 0 || idx >= RIDE_FLOW.length - 1) return { ok: true };

  // If still searching with no driver, dispatch first.
  if (ride.status === "searching_driver" && !ride.driver_id) {
    await autoDispatchAction(rideId);
    return { ok: true };
  }

  const next = RIDE_FLOW[idx + 1] as RideStatus;
  const changedBy = ride.driver_id ?? user.id;
  await db.updateRideStatus(rideId, next, changedBy);
  revalidatePath(`/app/course/${rideId}`);
  revalidatePath(`/driver/course/${rideId}`);
  return { ok: true };
}

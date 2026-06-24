"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/data/store";
import { requireUser } from "@/lib/auth/session";
import { IS_DEMO } from "@/lib/config";
import { haversineKm } from "@/lib/geo";
import { RIDE_FLOW, type RideStatus } from "@/lib/types";
import type { ActionState } from "./account";

/**
 * Simulated automatic dispatch (mode "affectation automatique simulée").
 * Assigns the nearest online, approved driver to a searching ride.
 */
export async function autoDispatchAction(rideId: string): Promise<ActionState> {
  const user = await requireUser();
  const ride = await db.getRide(rideId);
  if (!ride) return { error: "Course introuvable." };
  if (ride.customer_id !== user.id && user.role !== "admin") return { error: "Action non autorisée." };
  if (ride.driver_id || (ride.status !== "searching_driver" && ride.status !== "requested")) {
    return { ok: true };
  }

  const drivers = await db.listDriverProfiles("approved");
  const online = drivers.filter((d) => d.is_online && d.current_latitude != null && d.current_longitude != null);
  if (online.length === 0) return { error: "Aucun chauffeur en ligne pour le moment." };

  const nearest = online
    .map((d) => ({
      d,
      dist: haversineKm(
        { lat: ride.pickup_latitude, lng: ride.pickup_longitude },
        { lat: d.current_latitude!, lng: d.current_longitude! },
      ),
    }))
    .sort((a, b) => a.dist - b.dist)[0];

  await db.assignDriver(rideId, nearest.d.user_id, "system");
  revalidatePath(`/app/course/${rideId}`);
  return { ok: true };
}

/**
 * Demo-only helper: advance a ride one step along the happy path so a solo
 * tester can experience the full flow without switching accounts.
 */
export async function demoAdvanceRideAction(rideId: string): Promise<ActionState> {
  if (!IS_DEMO) return { error: "Disponible en mode démonstration uniquement." };
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

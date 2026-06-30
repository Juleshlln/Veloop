import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { estimateRoute, estimateDriverArrivalMin } from "@/lib/geo";
import { computePrice } from "@/lib/pricing";
import type {
  ApprovalStatus,
  CustomerVehicle,
  DriverDocument,
  DriverProfile,
  Incident,
  Notification,
  Payment,
  PaymentStatus,
  PricingSettings,
  Profile,
  Rating,
  RideRequest,
  RideStatus,
  RideStatusEvent,
  RideWithRelations,
  SavedAddress,
  UserRole,
  VehicleInspection,
  VerificationStatus,
} from "@/lib/types";
import type { Db } from "./demo-store";

/* ============================================================
   Veloop — Supabase-backed repository
   Same async API as the demo store. RLS governs reads/simple writes;
   cross-cutting mutations (assign, status, cancel, approval, payment)
   go through SECURITY DEFINER RPCs.
   ============================================================ */

type Row = Record<string, unknown>;
const n = (v: unknown): number => Number(v);
const nn = (v: unknown): number | null => (v == null ? null : Number(v));

function mapDriverProfile(r: Row): DriverProfile {
  return {
    ...(r as unknown as DriverProfile),
    average_rating: n(r.average_rating),
    completed_trips: n(r.completed_trips),
    years_of_experience: n(r.years_of_experience),
    current_latitude: nn(r.current_latitude),
    current_longitude: nn(r.current_longitude),
  };
}

function mapRideRow(r: Row): RideRequest {
  return {
    ...(r as unknown as RideRequest),
    pickup_latitude: n(r.pickup_latitude),
    pickup_longitude: n(r.pickup_longitude),
    destination_latitude: n(r.destination_latitude),
    destination_longitude: n(r.destination_longitude),
    passenger_count: n(r.passenger_count),
    estimated_distance_km: n(r.estimated_distance_km),
    estimated_duration_minutes: n(r.estimated_duration_minutes),
    estimated_driver_arrival_minutes: n(r.estimated_driver_arrival_minutes),
    estimated_price: n(r.estimated_price),
    final_price: nn(r.final_price),
  };
}

function mapPayment(r: Row): Payment {
  return { ...(r as unknown as Payment), amount: n(r.amount) };
}

function mapPricing(r: Row): PricingSettings {
  return {
    ...(r as unknown as PricingSettings),
    base_fee: n(r.base_fee),
    price_per_km: n(r.price_per_km),
    price_per_minute: n(r.price_per_minute),
    minimum_price: n(r.minimum_price),
    night_multiplier: n(r.night_multiplier),
    surge_multiplier: n(r.surge_multiplier),
  };
}

function mapVehicle(r: Row): CustomerVehicle {
  return r as unknown as CustomerVehicle;
}

function mapAddress(r: Row): SavedAddress {
  return { ...(r as unknown as SavedAddress), latitude: n(r.latitude), longitude: n(r.longitude) };
}

const RIDE_SELECT =
  "*, customer:profiles!customer_id(*), driver:profiles!driver_id(*), vehicle:customer_vehicles!vehicle_id(*), payment:payments(*), rating:ratings(*)";

async function attachDriverProfiles(rides: RideWithRelations[]): Promise<RideWithRelations[]> {
  const driverIds = [...new Set(rides.map((r) => r.driver_id).filter(Boolean))] as string[];
  if (driverIds.length === 0) return rides;
  const sb = await getSupabaseServerClient();
  const { data } = await sb.from("driver_profiles").select("*").in("user_id", driverIds);
  const byUser = new Map((data ?? []).map((d) => [(d as Row).user_id as string, mapDriverProfile(d as Row)]));
  for (const ride of rides) {
    if (ride.driver_id) ride.driverProfile = byUser.get(ride.driver_id);
  }
  return rides;
}

function mapRideWithRelations(r: Row): RideWithRelations {
  const payment = (r.payment as Row[] | null)?.[0];
  const rating = (r.rating as Row[] | null)?.[0];
  return {
    ...mapRideRow(r),
    customer: (r.customer as Profile) ?? undefined,
    driver: (r.driver as Profile) ?? undefined,
    vehicle: r.vehicle ? mapVehicle(r.vehicle as Row) : undefined,
    payment: payment ? mapPayment(payment) : undefined,
    rating: rating ? ({ ...(rating as unknown as Rating), score: n((rating as Row).score) }) : undefined,
  };
}

export const supabaseDb: Db = {
  /* ---------------- Profiles / auth ---------------- */
  async getProfileById(id) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    return (data as Profile) ?? null;
  },
  async getProfileByEmail(email) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("profiles").select("*").ilike("email", email).maybeSingle();
    return (data as Profile) ?? null;
  },
  async verifyCredentials() {
    // Auth is handled by Supabase Auth in this mode.
    return null;
  },
  async createUser(): Promise<Profile> {
    throw new Error("createUser est géré par Supabase Auth.");
  },
  async updateProfile(id, patch) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("profiles").update(patch).eq("id", id).select("*").maybeSingle();
    return (data as Profile) ?? null;
  },
  async setProfileStatus(id, status) {
    const sb = await getSupabaseServerClient();
    await sb.from("profiles").update({ status }).eq("id", id);
  },
  async listProfiles(role) {
    const sb = await getSupabaseServerClient();
    let q = sb.from("profiles").select("*").order("created_at", { ascending: false });
    if (role) q = q.eq("role", role);
    const { data } = await q;
    return (data ?? []) as Profile[];
  },

  /* ---------------- Driver profiles ---------------- */
  async getDriverProfile(userId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("driver_profiles").select("*").eq("user_id", userId).maybeSingle();
    return data ? mapDriverProfile(data as Row) : null;
  },
  async listDriverProfiles(approval) {
    const sb = await getSupabaseServerClient();
    let q = sb.from("driver_profiles").select("*, profile:profiles!user_id(*)");
    if (approval) q = q.eq("approval_status", approval);
    const { data } = await q;
    return (data ?? []).map((d) => ({ ...mapDriverProfile(d as Row), profile: (d as Row).profile as Profile | undefined }));
  },
  async setDriverOnline(userId, online) {
    const sb = await getSupabaseServerClient();
    await sb.from("driver_profiles").update({ is_online: online }).eq("user_id", userId);
  },
  async setDriverApproval(userId, status, reason) {
    const sb = await getSupabaseServerClient();
    const { error } = await sb.rpc("set_driver_approval", { p_user_id: userId, p_status: status, p_reason: reason ?? null });
    if (error) throw new Error(error.message);
  },
  async updateDriverProfile(userId, patch) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("driver_profiles").update(patch).eq("user_id", userId).select("*").maybeSingle();
    return data ? mapDriverProfile(data as Row) : null;
  },
  async listDriverDocuments(userId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("driver_documents").select("*").eq("driver_id", userId);
    return (data ?? []) as DriverDocument[];
  },
  async setDocumentStatus(docId, status, reason) {
    const sb = await getSupabaseServerClient();
    await sb.from("driver_documents").update({ verification_status: status, rejection_reason: reason ?? null }).eq("id", docId);
  },

  /* ---------------- Vehicles ---------------- */
  async listVehicles(customerId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("customer_vehicles").select("*").eq("customer_id", customerId).order("created_at");
    return (data ?? []).map((v) => mapVehicle(v as Row));
  },
  async getVehicle(id) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("customer_vehicles").select("*").eq("id", id).maybeSingle();
    return data ? mapVehicle(data as Row) : null;
  },
  async addVehicle(input) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb.from("customer_vehicles").insert(input).select("*").single();
    if (error) throw new Error(error.message);
    return mapVehicle(data as Row);
  },
  async deleteVehicle(id, customerId) {
    const sb = await getSupabaseServerClient();
    await sb.from("customer_vehicles").delete().eq("id", id).eq("customer_id", customerId);
  },

  /* ---------------- Saved addresses ---------------- */
  async listAddresses(userId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("saved_addresses").select("*").eq("user_id", userId).order("created_at");
    return (data ?? []).map((a) => mapAddress(a as Row));
  },
  async addAddress(input) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb.from("saved_addresses").insert(input).select("*").single();
    if (error) throw new Error(error.message);
    return mapAddress(data as Row);
  },
  async deleteAddress(id, userId) {
    const sb = await getSupabaseServerClient();
    await sb.from("saved_addresses").delete().eq("id", id).eq("user_id", userId);
  },

  /* ---------------- Rides ---------------- */
  async createRide(input) {
    const sb = await getSupabaseServerClient();
    const pricing = await this.getPricing();
    const route = estimateRoute(
      { lat: input.pickup.lat, lng: input.pickup.lng },
      { lat: input.destination.lat, lng: input.destination.lng },
    );
    const breakdown = computePrice({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      settings: pricing,
      when: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
    });
    const initialStatus: RideStatus = input.scheduledAt ? "requested" : "searching_driver";
    const { data, error } = await sb
      .from("ride_requests")
      .insert({
        customer_id: input.customerId,
        vehicle_id: input.vehicleId,
        pickup_address: input.pickup.address,
        pickup_latitude: input.pickup.lat,
        pickup_longitude: input.pickup.lng,
        destination_address: input.destination.address,
        destination_latitude: input.destination.lat,
        destination_longitude: input.destination.lng,
        scheduled_at: input.scheduledAt,
        passenger_count: input.passengerCount,
        estimated_distance_km: route.distanceKm,
        estimated_duration_minutes: route.durationMin,
        estimated_driver_arrival_minutes: estimateDriverArrivalMin(2.5),
        estimated_price: breakdown.total,
        status: initialStatus,
        customer_notes: input.notes ?? null,
      })
      .select(RIDE_SELECT)
      .single();
    if (error) throw new Error(error.message);
    await sb.from("ride_status_history").insert({ ride_id: (data as Row).id as string, status: initialStatus, changed_by: input.customerId });
    await sb.from("notifications").insert({ user_id: input.customerId, title: "Demande enregistrée", body: "Votre demande de course Veloop a bien été enregistrée.", type: "ride" });
    const [ride] = await attachDriverProfiles([mapRideWithRelations(data as Row)]);
    return ride;
  },
  async getRide(id) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_requests").select("*").eq("id", id).maybeSingle();
    return data ? mapRideRow(data as Row) : null;
  },
  async getRideWithRelations(id) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_requests").select(RIDE_SELECT).eq("id", id).maybeSingle();
    if (!data) return null;
    const [ride] = await attachDriverProfiles([mapRideWithRelations(data as Row)]);
    return ride;
  },
  async getRideHistory(rideId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_status_history").select("*").eq("ride_id", rideId).order("created_at");
    return (data ?? []) as RideStatusEvent[];
  },
  async listRidesForCustomer(customerId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_requests").select(RIDE_SELECT).eq("customer_id", customerId).order("created_at", { ascending: false });
    return attachDriverProfiles((data ?? []).map((r) => mapRideWithRelations(r as Row)));
  },
  async getActiveRideForCustomer(customerId) {
    const sb = await getSupabaseServerClient();
    const active: RideStatus[] = ["requested", "searching_driver", "driver_assigned", "driver_on_the_way", "driver_arrived", "vehicle_check", "trip_started", "trip_in_progress"];
    const { data } = await sb.from("ride_requests").select(RIDE_SELECT).eq("customer_id", customerId).in("status", active).order("created_at", { ascending: false }).limit(1);
    if (!data || data.length === 0) return null;
    const [ride] = await attachDriverProfiles([mapRideWithRelations(data[0] as Row)]);
    return ride;
  },
  async listRidesForDriver(driverId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_requests").select(RIDE_SELECT).eq("driver_id", driverId).order("created_at", { ascending: false });
    return attachDriverProfiles((data ?? []).map((r) => mapRideWithRelations(r as Row)));
  },
  async listOpenRides() {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_requests").select(RIDE_SELECT).is("driver_id", null).in("status", ["searching_driver", "requested"]).order("created_at", { ascending: false });
    return attachDriverProfiles((data ?? []).map((r) => mapRideWithRelations(r as Row)));
  },
  async listAllRides() {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ride_requests").select(RIDE_SELECT).order("created_at", { ascending: false });
    return attachDriverProfiles((data ?? []).map((r) => mapRideWithRelations(r as Row)));
  },
  async assignDriver(rideId, driverId) {
    const sb = await getSupabaseServerClient();
    const { error } = await sb.rpc("assign_ride_driver", { p_ride_id: rideId, p_driver_id: driverId });
    if (error) throw new Error(error.message);
  },
  async autoAssignNearestDriver(rideId) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb.rpc("assign_nearest_driver", { p_ride_id: rideId });
    if (error) throw new Error(error.message);
    return Boolean(data);
  },
  async updateRideStatus(rideId, status) {
    const sb = await getSupabaseServerClient();
    const { error } = await sb.rpc("update_ride_status", { p_ride_id: rideId, p_status: status });
    if (error) throw new Error(error.message);
    return this.getRideWithRelations(rideId);
  },
  async cancelRide(rideId, reason) {
    const sb = await getSupabaseServerClient();
    const { error } = await sb.rpc("cancel_ride", { p_ride_id: rideId, p_reason: reason });
    if (error) throw new Error(error.message);
  },

  /* ---------------- Inspections ---------------- */
  async getInspection(rideId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("vehicle_inspections").select("*").eq("ride_id", rideId).maybeSingle();
    return (data as VehicleInspection) ?? null;
  },
  async upsertInspection(rideId, driverId, patch) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb
      .from("vehicle_inspections")
      .upsert({ ride_id: rideId, driver_id: driverId, ...patch }, { onConflict: "ride_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as VehicleInspection;
  },

  /* ---------------- Payments ---------------- */
  async getPaymentForRide(rideId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("payments").select("*").eq("ride_id", rideId).maybeSingle();
    return data ? mapPayment(data as Row) : null;
  },
  async upsertPayment(rideId, customerId, amount, status, intentId) {
    const sb = await getSupabaseServerClient();
    const { error } = await sb.rpc("upsert_payment", { p_ride_id: rideId, p_customer_id: customerId, p_amount: amount, p_status: status, p_intent: intentId ?? null });
    if (error) throw new Error(error.message);
    return (await this.getPaymentForRide(rideId)) as Payment;
  },
  async setPaymentStatusByIntent(intentId, status) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("payments").update({ status }).eq("stripe_payment_intent_id", intentId).select("*").maybeSingle();
    return data ? mapPayment(data as Row) : null;
  },
  async listPayments() {
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from("payments")
      .select("*, ride:ride_requests!ride_id(*), customer:profiles!customer_id(*)")
      .order("created_at", { ascending: false });
    return (data ?? []).map((p) => ({
      ...mapPayment(p as Row),
      ride: (p as Row).ride ? mapRideRow((p as Row).ride as Row) : undefined,
      customer: (p as Row).customer as Profile | undefined,
    }));
  },

  /* ---------------- Ratings ---------------- */
  async getRatingForRide(rideId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("ratings").select("*").eq("ride_id", rideId).maybeSingle();
    return data ? ({ ...(data as unknown as Rating), score: n((data as Row).score) }) : null;
  },
  async createRating(input) {
    const sb = await getSupabaseServerClient();
    const existing = await this.getRatingForRide(input.ride_id);
    if (existing) return existing;
    const { data, error } = await sb.from("ratings").insert(input).select("*").single();
    if (error) throw new Error(error.message);
    await sb.rpc("create_notification", { p_user_id: input.driver_id, p_title: "Nouvelle évaluation", p_body: `Vous avez reçu une note de ${input.score}/5.`, p_type: "driver" });
    return { ...(data as unknown as Rating), score: n((data as Row).score) };
  },

  /* ---------------- Incidents ---------------- */
  async listIncidents() {
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from("incidents")
      .select("*, reporter:profiles!reported_by(*), ride:ride_requests!ride_id(*)")
      .order("created_at", { ascending: false });
    return (data ?? []).map((i) => ({
      ...(i as unknown as Incident),
      reporter: (i as Row).reporter as Profile | undefined,
      ride: (i as Row).ride ? mapRideRow((i as Row).ride as Row) : undefined,
    }));
  },
  async createIncident(input) {
    const sb = await getSupabaseServerClient();
    const { data, error } = await sb
      .from("incidents")
      .insert({ ride_id: input.rideId, reported_by: input.reportedBy, incident_type: input.type, description: input.description, priority: input.priority, status: "open" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    if (input.rideId) {
      const ride = await this.getRide(input.rideId);
      if (ride && ride.status !== "trip_completed") {
        await sb.from("ride_requests").update({ status: "incident_reported" }).eq("id", input.rideId);
      }
    }
    return data as Incident;
  },
  async updateIncidentStatus(id, status) {
    const sb = await getSupabaseServerClient();
    await sb.from("incidents").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
  },

  /* ---------------- Pricing ---------------- */
  async getPricing() {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("pricing_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) {
      return { id: "default", base_fee: 15, price_per_km: 1.5, price_per_minute: 0.35, minimum_price: 29, night_multiplier: 1.2, surge_multiplier: 1.0, updated_at: new Date(0).toISOString() };
    }
    return mapPricing(data as Row);
  },
  async updatePricing(patch) {
    const sb = await getSupabaseServerClient();
    const current = await this.getPricing();
    const { data, error } = await sb.from("pricing_settings").update(patch).eq("id", current.id).select("*").single();
    if (error) throw new Error(error.message);
    return mapPricing(data as Row);
  },

  /* ---------------- Notifications ---------------- */
  async listNotifications(userId) {
    const sb = await getSupabaseServerClient();
    const { data } = await sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return (data ?? []) as Notification[];
  },
  async countUnread(userId) {
    const sb = await getSupabaseServerClient();
    const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
    return count ?? 0;
  },
  async markNotificationsRead(userId) {
    const sb = await getSupabaseServerClient();
    await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  },

  /* ---------------- Admin stats ---------------- */
  async getAdminStats() {
    const sb = await getSupabaseServerClient();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const iso = startOfToday.toISOString();

    const [{ count: ridesToday }, { count: ridesCompleted }, { count: ridesCancelledToday }] = await Promise.all([
      sb.from("ride_requests").select("*", { count: "exact", head: true }).gte("created_at", iso),
      sb.from("ride_requests").select("*", { count: "exact", head: true }).eq("status", "trip_completed"),
      sb.from("ride_requests").select("*", { count: "exact", head: true }).eq("status", "cancelled").gte("created_at", iso),
    ]);

    const { data: paid } = await sb.from("payments").select("amount").eq("status", "paid");
    const revenue = (paid ?? []).reduce((s, p) => s + Number((p as Row).amount), 0);

    const [{ count: activeCustomers }, { count: approvedDrivers }, { count: onlineDrivers }, { count: pendingDrivers }, { count: openIncidents }] = await Promise.all([
      sb.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer").eq("status", "active"),
      sb.from("driver_profiles").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
      sb.from("driver_profiles").select("*", { count: "exact", head: true }).eq("is_online", true),
      sb.from("driver_profiles").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
      sb.from("incidents").select("*", { count: "exact", head: true }).neq("status", "resolved"),
    ]);

    const completed = ridesCompleted ?? 0;
    return {
      ridesToday: ridesToday ?? 0,
      ridesCompleted: completed,
      ridesCancelledToday: ridesCancelledToday ?? 0,
      revenue,
      avgBasket: completed ? revenue / completed : 0,
      activeCustomers: activeCustomers ?? 0,
      approvedDrivers: approvedDrivers ?? 0,
      onlineDrivers: onlineDrivers ?? 0,
      pendingDrivers: pendingDrivers ?? 0,
      openIncidents: openIncidents ?? 0,
    };
  },
};

import "server-only";
import type { StoreState } from "./state";
import { buildSeed } from "@/lib/demo/seed";
import { makeId } from "@/lib/utils";
import { computePrice } from "@/lib/pricing";
import { estimateRouteReal, estimateDriverArrivalMin, haversineKm } from "@/lib/geo";
import {
  RIDE_STATUS_META,
  type ApprovalStatus,
  type CustomerVehicle,
  type DriverProfile,
  type Incident,
  type IncidentPriority,
  type IncidentType,
  type InspectionPhoto,
  type Notification,
  type NotificationType,
  type Payment,
  type PaymentStatus,
  type PricingSettings,
  type Profile,
  type Rating,
  type RideRequest,
  type RideStatus,
  type RideWithRelations,
  type SavedAddress,
  type UserRole,
  type VehicleInspection,
  type VerificationStatus,
} from "@/lib/types";

/* ============================================================
   Veloop — Demo data store
   A single in-memory database, seeded once per server process and
   kept on globalThis so it survives Next.js HMR in development.
   The public `db` object is fully async so swapping in a Supabase
   implementation later requires no caller changes.
   ============================================================ */

const STORE_KEY = "__veloop_demo_store__";

function getState(): StoreState {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: StoreState };
  if (!g[STORE_KEY]) g[STORE_KEY] = buildSeed();
  return g[STORE_KEY]!;
}

function now(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/* ---------- relation helpers ---------- */

function joinRide(s: StoreState, ride: RideRequest): RideWithRelations {
  return {
    ...ride,
    customer: s.profiles.find((p) => p.id === ride.customer_id),
    driver: ride.driver_id ? s.profiles.find((p) => p.id === ride.driver_id) : undefined,
    driverProfile: ride.driver_id
      ? s.driverProfiles.find((d) => d.user_id === ride.driver_id)
      : undefined,
    vehicle: ride.vehicle_id
      ? s.customerVehicles.find((v) => v.id === ride.vehicle_id)
      : undefined,
    payment: s.payments.find((p) => p.ride_id === ride.id),
    rating: s.ratings.find((r) => r.ride_id === ride.id),
  };
}

function pushNotification(
  s: StoreState,
  userId: string | null | undefined,
  title: string,
  body: string,
  type: NotificationType,
) {
  if (!userId) return;
  const ntf: Notification = {
    id: makeId("ntf"),
    user_id: userId,
    title,
    body,
    type,
    read_at: null,
    created_at: now(),
  };
  s.notifications.unshift(ntf);
}

function recomputeDriverRating(s: StoreState, driverId: string) {
  const scores = s.ratings.filter((r) => r.driver_id === driverId).map((r) => r.score);
  const dp = s.driverProfiles.find((d) => d.user_id === driverId);
  if (dp && scores.length) {
    dp.average_rating = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }
}

/* ============================================================
   Public repository
   ============================================================ */

export const demoDb = {
  /* ---------------- Profiles / auth ---------------- */
  async getProfileById(id: string): Promise<Profile | null> {
    return clone(getState().profiles.find((p) => p.id === id) ?? null);
  },

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const e = email.toLowerCase();
    return clone(getState().profiles.find((p) => p.email.toLowerCase() === e) ?? null);
  },

  async verifyCredentials(email: string, password: string): Promise<Profile | null> {
    const s = getState();
    const e = email.toLowerCase();
    if (s.credentials[e] !== password) return null;
    return clone(s.profiles.find((p) => p.email.toLowerCase() === e) ?? null);
  },

  async createUser(input: {
    role: Exclude<UserRole, "admin">;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<Profile> {
    const s = getState();
    const email = input.email.toLowerCase();
    if (s.profiles.some((p) => p.email.toLowerCase() === email)) {
      throw new Error("Un compte existe déjà avec cette adresse e-mail.");
    }
    const profile: Profile = {
      id: makeId(input.role === "driver" ? "drv" : "cust"),
      role: input.role,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      avatar_url: null,
      status: "active",
      created_at: now(),
      updated_at: now(),
    };
    s.profiles.push(profile);
    s.credentials[email] = input.password;

    if (input.role === "driver") {
      s.driverProfiles.push({
        id: makeId("dp"),
        user_id: profile.id,
        approval_status: "pending",
        date_of_birth: null,
        driver_license_number: null,
        driver_license_expiry: null,
        years_of_experience: 0,
        folding_bike_confirmed: false,
        average_rating: 0,
        completed_trips: 0,
        is_online: false,
        current_latitude: null,
        current_longitude: null,
        created_at: now(),
        updated_at: now(),
      });
    }
    return clone(profile);
  },

  async updateProfile(id: string, patch: Partial<Pick<Profile, "first_name" | "last_name" | "phone" | "avatar_url">>): Promise<Profile | null> {
    const s = getState();
    const p = s.profiles.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, patch, { updated_at: now() });
    return clone(p);
  },

  async setProfileStatus(id: string, status: Profile["status"]): Promise<void> {
    const p = getState().profiles.find((x) => x.id === id);
    if (p) {
      p.status = status;
      p.updated_at = now();
    }
  },

  async listProfiles(role?: UserRole): Promise<Profile[]> {
    const s = getState();
    return clone(s.profiles.filter((p) => (role ? p.role === role : true)));
  },

  /* ---------------- Driver profiles ---------------- */
  async getDriverProfile(userId: string): Promise<DriverProfile | null> {
    return clone(getState().driverProfiles.find((d) => d.user_id === userId) ?? null);
  },

  async listDriverProfiles(approval?: ApprovalStatus): Promise<Array<DriverProfile & { profile?: Profile }>> {
    const s = getState();
    return clone(
      s.driverProfiles
        .filter((d) => (approval ? d.approval_status === approval : true))
        .map((d) => ({ ...d, profile: s.profiles.find((p) => p.id === d.user_id) })),
    );
  },

  async setDriverOnline(userId: string, online: boolean): Promise<void> {
    const dp = getState().driverProfiles.find((d) => d.user_id === userId);
    if (dp) {
      dp.is_online = online;
      dp.updated_at = now();
    }
  },

  async setDriverApproval(userId: string, status: ApprovalStatus, reason?: string): Promise<void> {
    const s = getState();
    const dp = s.driverProfiles.find((d) => d.user_id === userId);
    if (!dp) return;
    dp.approval_status = status;
    dp.updated_at = now();
    if (status === "approved") {
      s.driverDocuments
        .filter((doc) => doc.driver_id === userId)
        .forEach((doc) => (doc.verification_status = "approved"));
      pushNotification(s, userId, "Compte validé", "Votre profil chauffeur Veloop a été validé. Vous pouvez passer en ligne.", "document");
    } else if (status === "rejected") {
      pushNotification(s, userId, "Profil refusé", reason ?? "Votre profil chauffeur n'a pas été validé.", "document");
    }
  },

  async updateDriverProfile(userId: string, patch: Partial<DriverProfile>): Promise<DriverProfile | null> {
    const dp = getState().driverProfiles.find((d) => d.user_id === userId);
    if (!dp) return null;
    Object.assign(dp, patch, { updated_at: now() });
    return clone(dp);
  },

  async listDriverDocuments(userId: string) {
    return clone(getState().driverDocuments.filter((d) => d.driver_id === userId));
  },

  async setDocumentStatus(docId: string, status: VerificationStatus, reason?: string): Promise<void> {
    const doc = getState().driverDocuments.find((d) => d.id === docId);
    if (doc) {
      doc.verification_status = status;
      doc.rejection_reason = reason ?? null;
    }
  },

  /* ---------------- Vehicles ---------------- */
  async listVehicles(customerId: string): Promise<CustomerVehicle[]> {
    return clone(getState().customerVehicles.filter((v) => v.customer_id === customerId));
  },

  async getVehicle(id: string): Promise<CustomerVehicle | null> {
    return clone(getState().customerVehicles.find((v) => v.id === id) ?? null);
  },

  async addVehicle(input: Omit<CustomerVehicle, "id" | "created_at">): Promise<CustomerVehicle> {
    const s = getState();
    const vehicle: CustomerVehicle = { ...input, id: makeId("veh"), created_at: now() };
    s.customerVehicles.push(vehicle);
    return clone(vehicle);
  },

  async deleteVehicle(id: string, customerId: string): Promise<void> {
    const s = getState();
    s.customerVehicles = s.customerVehicles.filter((v) => !(v.id === id && v.customer_id === customerId));
  },

  /* ---------------- Saved addresses ---------------- */
  async listAddresses(userId: string): Promise<SavedAddress[]> {
    return clone(getState().savedAddresses.filter((a) => a.user_id === userId));
  },

  async addAddress(input: Omit<SavedAddress, "id" | "created_at">): Promise<SavedAddress> {
    const s = getState();
    const addr: SavedAddress = { ...input, id: makeId("addr"), created_at: now() };
    s.savedAddresses.push(addr);
    return clone(addr);
  },

  async deleteAddress(id: string, userId: string): Promise<void> {
    const s = getState();
    s.savedAddresses = s.savedAddresses.filter((a) => !(a.id === id && a.user_id === userId));
  },

  /* ---------------- Rides ---------------- */
  async createRide(input: {
    customerId: string;
    vehicleId: string;
    pickup: { address: string; lat: number; lng: number };
    destination: { address: string; lat: number; lng: number };
    scheduledAt: string | null;
    passengerCount: number;
    notes?: string | null;
  }): Promise<RideWithRelations> {
    const s = getState();
    const route = await estimateRouteReal(
      { lat: input.pickup.lat, lng: input.pickup.lng },
      { lat: input.destination.lat, lng: input.destination.lng },
    );
    const breakdown = computePrice({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      settings: s.pricingSettings,
      when: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
    });
    const initialStatus: RideStatus = input.scheduledAt ? "requested" : "searching_driver";
    const ride: RideRequest = {
      id: makeId("ride"),
      customer_id: input.customerId,
      driver_id: null,
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
      final_price: null,
      status: initialStatus,
      customer_notes: input.notes ?? null,
      cancellation_reason: null,
      created_at: now(),
      updated_at: now(),
    };
    s.rideRequests.unshift(ride);
    s.rideStatusHistory.push({
      id: makeId("evt"),
      ride_id: ride.id,
      status: initialStatus,
      changed_by: input.customerId,
      latitude: input.pickup.lat,
      longitude: input.pickup.lng,
      created_at: now(),
    });
    pushNotification(s, input.customerId, "Demande enregistrée", "Votre demande de course Veloop a bien été enregistrée.", "ride");
    return joinRide(s, ride);
  },

  async getRide(id: string): Promise<RideRequest | null> {
    return clone(getState().rideRequests.find((r) => r.id === id) ?? null);
  },

  async getRideWithRelations(id: string): Promise<RideWithRelations | null> {
    const s = getState();
    const ride = s.rideRequests.find((r) => r.id === id);
    return ride ? clone(joinRide(s, ride)) : null;
  },

  async getRideHistory(rideId: string) {
    return clone(
      getState()
        .rideStatusHistory.filter((e) => e.ride_id === rideId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    );
  },

  async listRidesForCustomer(customerId: string): Promise<RideWithRelations[]> {
    const s = getState();
    return clone(
      s.rideRequests
        .filter((r) => r.customer_id === customerId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => joinRide(s, r)),
    );
  },

  async getActiveRideForCustomer(customerId: string): Promise<RideWithRelations | null> {
    const s = getState();
    const active = s.rideRequests.find(
      (r) => r.customer_id === customerId && RIDE_STATUS_META[r.status].step >= 0 && r.status !== "trip_completed",
    );
    return active ? clone(joinRide(s, active)) : null;
  },

  async listRidesForDriver(driverId: string): Promise<RideWithRelations[]> {
    const s = getState();
    return clone(
      s.rideRequests
        .filter((r) => r.driver_id === driverId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => joinRide(s, r)),
    );
  },

  /** Unassigned rides available for drivers to accept. */
  async listOpenRides(): Promise<RideWithRelations[]> {
    const s = getState();
    return clone(
      s.rideRequests
        .filter((r) => !r.driver_id && (r.status === "searching_driver" || r.status === "requested"))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => joinRide(s, r)),
    );
  },

  async listAllRides(): Promise<RideWithRelations[]> {
    const s = getState();
    return clone(
      [...s.rideRequests]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => joinRide(s, r)),
    );
  },

  async assignDriver(rideId: string, driverId: string, changedBy: string): Promise<void> {
    const s = getState();
    const ride = s.rideRequests.find((r) => r.id === rideId);
    if (!ride) return;
    ride.driver_id = driverId;
    ride.status = "driver_assigned";
    ride.updated_at = now();
    s.rideStatusHistory.push({
      id: makeId("evt"),
      ride_id: rideId,
      status: "driver_assigned",
      changed_by: changedBy,
      latitude: null,
      longitude: null,
      created_at: now(),
    });
    const driver = s.profiles.find((p) => p.id === driverId);
    pushNotification(s, ride.customer_id, "Chauffeur trouvé", `${driver?.first_name ?? "Votre chauffeur"} a accepté votre course.`, "ride");
    pushNotification(s, driverId, "Course attribuée", "Une course vous a été attribuée.", "driver");
  },

  /** Assign the nearest online approved driver (simulated automatic dispatch). */
  async autoAssignNearestDriver(rideId: string): Promise<boolean> {
    const s = getState();
    const ride = s.rideRequests.find((r) => r.id === rideId);
    if (!ride || ride.driver_id || (ride.status !== "searching_driver" && ride.status !== "requested")) return false;
    const candidates = s.driverProfiles.filter(
      (d) => d.approval_status === "approved" && d.is_online && d.current_latitude != null && d.current_longitude != null,
    );
    if (candidates.length === 0) return false;
    const nearest = candidates
      .map((d) => ({
        d,
        dist: haversineKm(
          { lat: ride.pickup_latitude, lng: ride.pickup_longitude },
          { lat: d.current_latitude!, lng: d.current_longitude! },
        ),
      }))
      .sort((a, b) => a.dist - b.dist)[0];
    await this.assignDriver(rideId, nearest.d.user_id, "system");
    return true;
  },

  async updateRideStatus(rideId: string, status: RideStatus, changedBy: string, coords?: { lat: number; lng: number }): Promise<RideWithRelations | null> {
    const s = getState();
    const ride = s.rideRequests.find((r) => r.id === rideId);
    if (!ride) return null;
    ride.status = status;
    ride.updated_at = now();
    s.rideStatusHistory.push({
      id: makeId("evt"),
      ride_id: rideId,
      status,
      changed_by: changedBy,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      created_at: now(),
    });

    // Customer-facing notification for each meaningful status.
    const meta = RIDE_STATUS_META[status];
    pushNotification(s, ride.customer_id, meta.label, meta.description, "ride");

    if (status === "trip_completed") {
      ride.final_price = ride.estimated_price;
      // confirm / create payment
      let payment = s.payments.find((p) => p.ride_id === rideId);
      if (!payment) {
        payment = {
          id: makeId("pay"),
          ride_id: rideId,
          customer_id: ride.customer_id,
          stripe_payment_intent_id: `demo_pi_${rideId}`,
          amount: ride.final_price,
          currency: "EUR",
          status: "paid",
          created_at: now(),
          updated_at: now(),
        };
        s.payments.push(payment);
      } else {
        payment.status = "paid";
        payment.amount = ride.final_price;
        payment.updated_at = now();
      }
      pushNotification(s, ride.customer_id, "Paiement confirmé", `Le paiement de ${ride.final_price.toFixed(2)} € a été confirmé.`, "payment");
      if (ride.driver_id) {
        const dp = s.driverProfiles.find((d) => d.user_id === ride.driver_id);
        if (dp) dp.completed_trips += 1;
      }
    }
    return clone(joinRide(s, ride));
  },

  async cancelRide(rideId: string, reason: string, changedBy: string): Promise<void> {
    const s = getState();
    const ride = s.rideRequests.find((r) => r.id === rideId);
    if (!ride) return;
    ride.status = "cancelled";
    ride.cancellation_reason = reason;
    ride.updated_at = now();
    s.rideStatusHistory.push({
      id: makeId("evt"),
      ride_id: rideId,
      status: "cancelled",
      changed_by: changedBy,
      latitude: null,
      longitude: null,
      created_at: now(),
    });
    pushNotification(s, ride.customer_id, "Course annulée", "Votre course a été annulée.", "ride");
    if (ride.driver_id) pushNotification(s, ride.driver_id, "Course annulée", "Une de vos courses a été annulée.", "driver");
  },

  /* ---------------- Inspections ---------------- */
  async getInspection(rideId: string): Promise<VehicleInspection | null> {
    return clone(getState().vehicleInspections.find((i) => i.ride_id === rideId) ?? null);
  },

  async upsertInspection(rideId: string, driverId: string, patch: Partial<VehicleInspection>): Promise<VehicleInspection> {
    const s = getState();
    let insp = s.vehicleInspections.find((i) => i.ride_id === rideId);
    if (!insp) {
      insp = {
        id: makeId("insp"),
        ride_id: rideId,
        driver_id: driverId,
        customer_confirmed: false,
        driver_confirmed: false,
        driver_confirmed_at: null,
        customer_confirmed_at: null,
        initial_mileage: null,
        final_mileage: null,
        notes: null,
        created_at: now(),
      };
      s.vehicleInspections.push(insp);
    }
    // Timestamp each sign-off the moment it flips to confirmed (evidence trail).
    if (patch.driver_confirmed && !insp.driver_confirmed) patch.driver_confirmed_at = now();
    if (patch.customer_confirmed && !insp.customer_confirmed) patch.customer_confirmed_at = now();
    Object.assign(insp, patch);
    return clone(insp);
  },

  async addInspectionPhoto(rideId: string, driverId: string, photoType: string, fileUrl: string): Promise<InspectionPhoto> {
    const s = getState();
    let insp = s.vehicleInspections.find((i) => i.ride_id === rideId);
    if (!insp) {
      insp = await this.upsertInspection(rideId, driverId, {});
      insp = s.vehicleInspections.find((i) => i.ride_id === rideId)!;
    }
    // One photo per angle: replace any previous shot of the same type.
    s.inspectionPhotos = s.inspectionPhotos.filter(
      (p) => !(p.inspection_id === insp!.id && p.photo_type === photoType),
    );
    const photo: InspectionPhoto = {
      id: makeId("iph"),
      inspection_id: insp.id,
      photo_type: photoType,
      file_url: fileUrl,
      created_at: now(),
    };
    s.inspectionPhotos.push(photo);
    return clone(photo);
  },

  async listInspectionPhotos(rideId: string): Promise<InspectionPhoto[]> {
    const s = getState();
    const insp = s.vehicleInspections.find((i) => i.ride_id === rideId);
    if (!insp) return [];
    return clone(s.inspectionPhotos.filter((p) => p.inspection_id === insp.id));
  },

  /* ---------------- Payments ---------------- */
  async getPaymentForRide(rideId: string): Promise<Payment | null> {
    return clone(getState().payments.find((p) => p.ride_id === rideId) ?? null);
  },

  async upsertPayment(rideId: string, customerId: string, amount: number, status: PaymentStatus, intentId?: string): Promise<Payment> {
    const s = getState();
    let payment = s.payments.find((p) => p.ride_id === rideId);
    if (!payment) {
      payment = {
        id: makeId("pay"),
        ride_id: rideId,
        customer_id: customerId,
        stripe_payment_intent_id: intentId ?? `demo_pi_${rideId}`,
        amount,
        currency: "EUR",
        status,
        created_at: now(),
        updated_at: now(),
      };
      s.payments.push(payment);
    } else {
      payment.amount = amount;
      payment.status = status;
      if (intentId) payment.stripe_payment_intent_id = intentId;
      payment.updated_at = now();
    }
    return clone(payment);
  },

  async setPaymentStatusByIntent(intentId: string, status: PaymentStatus): Promise<Payment | null> {
    const s = getState();
    const payment = s.payments.find((p) => p.stripe_payment_intent_id === intentId);
    if (!payment) return null;
    payment.status = status;
    payment.updated_at = now();
    if (status === "paid") {
      const ride = s.rideRequests.find((r) => r.id === payment.ride_id);
      if (ride) pushNotification(s, ride.customer_id, "Paiement confirmé", `Paiement de ${payment.amount.toFixed(2)} € confirmé.`, "payment");
    }
    return clone(payment);
  },

  async listPayments(): Promise<Array<Payment & { ride?: RideRequest; customer?: Profile }>> {
    const s = getState();
    return clone(
      [...s.payments]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((p) => ({
          ...p,
          ride: s.rideRequests.find((r) => r.id === p.ride_id),
          customer: s.profiles.find((c) => c.id === p.customer_id),
        })),
    );
  },

  /* ---------------- Ratings ---------------- */
  async getRatingForRide(rideId: string): Promise<Rating | null> {
    return clone(getState().ratings.find((r) => r.ride_id === rideId) ?? null);
  },

  async createRating(input: Omit<Rating, "id" | "created_at">): Promise<Rating> {
    const s = getState();
    const existing = s.ratings.find((r) => r.ride_id === input.ride_id);
    if (existing) {
      Object.assign(existing, input);
      recomputeDriverRating(s, input.driver_id);
      return clone(existing);
    }
    const rating: Rating = { ...input, id: makeId("rate"), created_at: now() };
    s.ratings.push(rating);
    recomputeDriverRating(s, input.driver_id);
    pushNotification(s, input.driver_id, "Nouvelle évaluation", `Vous avez reçu une note de ${input.score}/5.`, "driver");
    return clone(rating);
  },

  /* ---------------- Incidents ---------------- */
  async listIncidents(): Promise<Array<Incident & { reporter?: Profile; ride?: RideRequest }>> {
    const s = getState();
    return clone(
      [...s.incidents]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((i) => ({
          ...i,
          reporter: s.profiles.find((p) => p.id === i.reported_by),
          ride: i.ride_id ? s.rideRequests.find((r) => r.id === i.ride_id) : undefined,
        })),
    );
  },

  async createIncident(input: {
    rideId: string | null;
    reportedBy: string;
    type: IncidentType;
    description: string;
    priority: IncidentPriority;
  }): Promise<Incident> {
    const s = getState();
    const incident: Incident = {
      id: makeId("inc"),
      ride_id: input.rideId,
      reported_by: input.reportedBy,
      incident_type: input.type,
      description: input.description,
      priority: input.priority,
      status: "open",
      created_at: now(),
      resolved_at: null,
    };
    s.incidents.unshift(incident);
    if (input.rideId) {
      const ride = s.rideRequests.find((r) => r.id === input.rideId);
      if (ride && ride.status !== "trip_completed") {
        ride.status = "incident_reported";
        ride.updated_at = now();
      }
    }
    return clone(incident);
  },

  async updateIncidentStatus(id: string, status: Incident["status"]): Promise<void> {
    const inc = getState().incidents.find((i) => i.id === id);
    if (inc) {
      inc.status = status;
      inc.resolved_at = status === "resolved" ? now() : null;
    }
  },

  /* ---------------- Pricing ---------------- */
  async getPricing(): Promise<PricingSettings> {
    return clone(getState().pricingSettings);
  },

  async updatePricing(patch: Partial<Omit<PricingSettings, "id" | "updated_at">>): Promise<PricingSettings> {
    const s = getState();
    Object.assign(s.pricingSettings, patch, { updated_at: now() });
    return clone(s.pricingSettings);
  },

  /* ---------------- Notifications ---------------- */
  async listNotifications(userId: string): Promise<Notification[]> {
    return clone(
      getState()
        .notifications.filter((n) => n.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  },

  async countUnread(userId: string): Promise<number> {
    return getState().notifications.filter((n) => n.user_id === userId && !n.read_at).length;
  },

  async markNotificationsRead(userId: string): Promise<void> {
    getState()
      .notifications.filter((n) => n.user_id === userId && !n.read_at)
      .forEach((n) => (n.read_at = now()));
  },

  /* ---------------- Admin stats ---------------- */
  async getAdminStats() {
    const s = getState();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRides = s.rideRequests.filter((r) => new Date(r.created_at) >= startOfToday);
    const completed = s.rideRequests.filter((r) => r.status === "trip_completed");
    const cancelledToday = todayRides.filter((r) => r.status === "cancelled").length;
    const revenue = s.payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
    const avgBasket = completed.length ? revenue / completed.length : 0;
    return {
      ridesToday: todayRides.length,
      ridesCompleted: completed.length,
      ridesCancelledToday: cancelledToday,
      revenue,
      avgBasket,
      activeCustomers: s.profiles.filter((p) => p.role === "customer" && p.status === "active").length,
      approvedDrivers: s.driverProfiles.filter((d) => d.approval_status === "approved").length,
      onlineDrivers: s.driverProfiles.filter((d) => d.is_online).length,
      pendingDrivers: s.driverProfiles.filter((d) => d.approval_status === "pending").length,
      openIncidents: s.incidents.filter((i) => i.status !== "resolved").length,
    };
  },
};

export type Db = typeof demoDb;

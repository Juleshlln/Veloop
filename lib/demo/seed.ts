import type { StoreState } from "@/lib/data/state";
import type {
  CustomerVehicle,
  DriverProfile,
  Incident,
  Payment,
  Profile,
  Rating,
  RideRequest,
  RideStatus,
  RideStatusEvent,
} from "@/lib/types";
import { RIDE_FLOW } from "@/lib/types";
import { DEMO_PLACES, estimateRoute, estimateDriverArrivalMin } from "@/lib/geo";
import { computePrice, DEFAULT_PRICING } from "@/lib/pricing";

const DEMO_PASSWORD = "veloop123";

function iso(offsetMin: number, base = Date.now()): string {
  return new Date(base + offsetMin * 60_000).toISOString();
}

function place(id: string) {
  const p = DEMO_PLACES.find((x) => x.id === id);
  if (!p) throw new Error(`Demo place not found: ${id}`);
  return p;
}

/** Build the full initial demo dataset. Called once per server process. */
export function buildSeed(): StoreState {
  const profiles: Profile[] = [];
  const credentials: Record<string, string> = {};

  function addProfile(p: Omit<Profile, "created_at" | "updated_at">, createdMin: number): Profile {
    const full: Profile = { ...p, created_at: iso(createdMin), updated_at: iso(createdMin) };
    profiles.push(full);
    credentials[full.email.toLowerCase()] = DEMO_PASSWORD;
    return full;
  }

  /* ---------------- Customers ---------------- */
  const customers = [
    addProfile({ id: "cust_1", role: "customer", first_name: "Camille", last_name: "Bernard", email: "client@veloop.fr", phone: "+33 6 12 34 56 78", avatar_url: null, status: "active" }, -60 * 24 * 40),
    addProfile({ id: "cust_2", role: "customer", first_name: "Lucas", last_name: "Moreau", email: "lucas.moreau@example.fr", phone: "+33 6 22 11 44 88", avatar_url: null, status: "active" }, -60 * 24 * 30),
    addProfile({ id: "cust_3", role: "customer", first_name: "Inès", last_name: "Dubois", email: "ines.dubois@example.fr", phone: "+33 6 77 88 99 00", avatar_url: null, status: "active" }, -60 * 24 * 22),
    addProfile({ id: "cust_4", role: "customer", first_name: "Thomas", last_name: "Petit", email: "thomas.petit@example.fr", phone: "+33 6 55 66 77 88", avatar_url: null, status: "active" }, -60 * 24 * 14),
    addProfile({ id: "cust_5", role: "customer", first_name: "Sarah", last_name: "Lefebvre", email: "sarah.lefebvre@example.fr", phone: "+33 6 33 22 11 00", avatar_url: null, status: "suspended" }, -60 * 24 * 9),
  ];

  /* ---------------- Drivers ---------------- */
  const driverProfilesData: Array<{
    profile: Omit<Profile, "created_at" | "updated_at">;
    createdMin: number;
    dp: Omit<DriverProfile, "id" | "user_id" | "created_at" | "updated_at">;
  }> = [
    {
      profile: { id: "drv_1", role: "driver", first_name: "Mehdi", last_name: "Cherif", email: "chauffeur@veloop.fr", phone: "+33 6 98 76 54 32", avatar_url: null, status: "active" },
      createdMin: -60 * 24 * 50,
      dp: { approval_status: "approved", date_of_birth: "1990-04-12", driver_license_number: "59A12345678", driver_license_expiry: "2030-04-11", years_of_experience: 8, folding_bike_confirmed: true, average_rating: 4.9, completed_trips: 132, is_online: true, current_latitude: 50.6352, current_longitude: 3.0651 },
    },
    {
      profile: { id: "drv_2", role: "driver", first_name: "Julie", last_name: "Roussel", email: "julie.roussel@example.fr", phone: "+33 6 11 22 33 44", avatar_url: null, status: "active" },
      createdMin: -60 * 24 * 44,
      dp: { approval_status: "approved", date_of_birth: "1994-09-30", driver_license_number: "59B98765432", driver_license_expiry: "2029-09-29", years_of_experience: 6, folding_bike_confirmed: true, average_rating: 4.8, completed_trips: 87, is_online: true, current_latitude: 50.6486, current_longitude: 3.0316 },
    },
    {
      profile: { id: "drv_3", role: "driver", first_name: "Antoine", last_name: "Girard", email: "antoine.girard@example.fr", phone: "+33 6 44 55 66 77", avatar_url: null, status: "active" },
      createdMin: -60 * 24 * 20,
      dp: { approval_status: "approved", date_of_birth: "1988-01-22", driver_license_number: "59C45678912", driver_license_expiry: "2031-01-21", years_of_experience: 11, folding_bike_confirmed: true, average_rating: 4.7, completed_trips: 54, is_online: false, current_latitude: 50.6927, current_longitude: 3.1746 },
    },
    {
      profile: { id: "drv_4", role: "driver", first_name: "Nadia", last_name: "Benali", email: "nadia.benali@example.fr", phone: "+33 6 66 77 88 99", avatar_url: null, status: "active" },
      createdMin: -60 * 24 * 6,
      dp: { approval_status: "pending", date_of_birth: "1996-06-18", driver_license_number: "59D11223344", driver_license_expiry: "2028-06-17", years_of_experience: 4, folding_bike_confirmed: true, average_rating: 0, completed_trips: 0, is_online: false, current_latitude: null, current_longitude: null },
    },
    {
      profile: { id: "drv_5", role: "driver", first_name: "Karim", last_name: "Haddad", email: "karim.haddad@example.fr", phone: "+33 6 00 11 22 33", avatar_url: null, status: "active" },
      createdMin: -60 * 24 * 3,
      dp: { approval_status: "pending", date_of_birth: "1992-11-05", driver_license_number: "59E55667788", driver_license_expiry: "2027-11-04", years_of_experience: 7, folding_bike_confirmed: false, average_rating: 0, completed_trips: 0, is_online: false, current_latitude: null, current_longitude: null },
    },
  ];

  const driverProfiles: DriverProfile[] = [];
  const drivers: Profile[] = [];
  for (const d of driverProfilesData) {
    const p = addProfile(d.profile, d.createdMin);
    drivers.push(p);
    driverProfiles.push({
      id: `dp_${p.id}`,
      user_id: p.id,
      created_at: iso(d.createdMin),
      updated_at: iso(d.createdMin),
      ...d.dp,
    });
  }

  /* ---------------- Admin ---------------- */
  addProfile({ id: "admin_1", role: "admin", first_name: "Sophie", last_name: "Laurent", email: "admin@veloop.fr", phone: "+33 6 90 80 70 60", avatar_url: null, status: "active" }, -60 * 24 * 90);

  /* ---------------- Driver documents ---------------- */
  const driverDocuments: StoreState["driverDocuments"] = [];
  for (const d of driverProfiles) {
    const status = d.approval_status === "approved" ? "approved" : "pending";
    (["permis_recto", "permis_verso", "piece_identite", "photo_velo"] as const).forEach((t, i) => {
      driverDocuments.push({
        id: `doc_${d.user_id}_${i}`,
        driver_id: d.user_id,
        document_type: t,
        file_url: t === "photo_velo" && !d.folding_bike_confirmed ? null : `/demo/documents/${d.user_id}-${t}.jpg`,
        verification_status: t === "photo_velo" && !d.folding_bike_confirmed ? "pending" : status,
        rejection_reason: null,
        created_at: d.created_at,
      });
    });
  }

  /* ---------------- Vehicles (10, 2 per customer) ---------------- */
  const vehicleSpecs: Array<Omit<CustomerVehicle, "id" | "created_at">> = [
    { customer_id: "cust_1", brand: "Peugeot", model: "308", registration_number: "FA-123-BC", color: "Gris", vehicle_type: "berline", transmission_type: "manuelle", notes: "Coffre spacieux" },
    { customer_id: "cust_1", brand: "Renault", model: "Clio", registration_number: "FB-456-CD", color: "Blanc", vehicle_type: "citadine", transmission_type: "automatique", notes: null },
    { customer_id: "cust_2", brand: "Volkswagen", model: "Golf", registration_number: "FC-789-DE", color: "Noir", vehicle_type: "berline", transmission_type: "manuelle", notes: null },
    { customer_id: "cust_2", brand: "Citroën", model: "C3", registration_number: "FD-012-EF", color: "Rouge", vehicle_type: "citadine", transmission_type: "manuelle", notes: null },
    { customer_id: "cust_3", brand: "Tesla", model: "Model 3", registration_number: "FE-345-FG", color: "Bleu", vehicle_type: "berline", transmission_type: "automatique", notes: "Véhicule électrique" },
    { customer_id: "cust_3", brand: "Dacia", model: "Sandero", registration_number: "FF-678-GH", color: "Beige", vehicle_type: "citadine", transmission_type: "manuelle", notes: null },
    { customer_id: "cust_4", brand: "BMW", model: "Série 3", registration_number: "FG-901-HI", color: "Gris", vehicle_type: "berline", transmission_type: "automatique", notes: null },
    { customer_id: "cust_4", brand: "Peugeot", model: "3008", registration_number: "FH-234-IJ", color: "Blanc", vehicle_type: "suv", transmission_type: "automatique", notes: "SUV familial" },
    { customer_id: "cust_5", brand: "Audi", model: "A4 Avant", registration_number: "FI-567-JK", color: "Noir", vehicle_type: "break", transmission_type: "automatique", notes: null },
    { customer_id: "cust_5", brand: "Renault", model: "Scénic", registration_number: "FJ-890-KL", color: "Gris", vehicle_type: "monospace", transmission_type: "manuelle", notes: "7 places" },
  ];
  const customerVehicles: CustomerVehicle[] = vehicleSpecs.map((v, i) => ({
    id: `veh_${i + 1}`,
    created_at: iso(-60 * 24 * 20),
    ...v,
  }));

  /* ---------------- Saved addresses ---------------- */
  const savedAddresses: StoreState["savedAddresses"] = [
    { id: "addr_1", user_id: "cust_1", label: "Domicile", address: place("p_vieux_lille").address, latitude: place("p_vieux_lille").coordinates.lat, longitude: place("p_vieux_lille").coordinates.lng, created_at: iso(-60 * 24 * 30) },
    { id: "addr_2", user_id: "cust_1", label: "Travail", address: place("p_eurale").address, latitude: place("p_eurale").coordinates.lat, longitude: place("p_eurale").coordinates.lng, created_at: iso(-60 * 24 * 30) },
    { id: "addr_3", user_id: "cust_2", label: "Domicile", address: place("p_lambersart").address, latitude: place("p_lambersart").coordinates.lat, longitude: place("p_lambersart").coordinates.lng, created_at: iso(-60 * 24 * 20) },
  ];

  /* ---------------- Rides ---------------- */
  interface RideSpec {
    id: string;
    customer: string;
    driver: string | null;
    vehicle: string;
    from: string;
    to: string;
    status: RideStatus;
    createdMin: number;
    scheduledMin: number | null;
    passengers: number;
    notes?: string | null;
  }

  const rideSpecs: RideSpec[] = [
    { id: "ride_1", customer: "cust_1", driver: "drv_1", vehicle: "veh_1", from: "p_grand_place", to: "p_vieux_lille", status: "trip_in_progress", createdMin: -35, scheduledMin: null, passengers: 1, notes: "Sortie restaurant" },
    { id: "ride_2", customer: "cust_2", driver: null, vehicle: "veh_3", from: "p_wazemmes", to: "p_lambersart", status: "searching_driver", createdMin: -4, scheduledMin: null, passengers: 2 },
    { id: "ride_3", customer: "cust_3", driver: "drv_2", vehicle: "veh_5", from: "p_eurale", to: "p_marcq", status: "driver_on_the_way", createdMin: -12, scheduledMin: null, passengers: 1 },
    { id: "ride_4", customer: "cust_4", driver: null, vehicle: "veh_7", from: "p_pdb", to: "p_vda", status: "requested", createdMin: -2, scheduledMin: 90, passengers: 3, notes: "Après le match" },
    { id: "ride_5", customer: "cust_1", driver: "drv_1", vehicle: "veh_1", from: "p_lesquin", to: "p_vieux_lille", status: "trip_completed", createdMin: -60 * 30, scheduledMin: null, passengers: 1 },
    { id: "ride_6", customer: "cust_2", driver: "drv_2", vehicle: "veh_3", from: "p_grand_place", to: "p_lambersart", status: "trip_completed", createdMin: -60 * 26, scheduledMin: null, passengers: 1 },
    { id: "ride_7", customer: "cust_3", driver: "drv_1", vehicle: "veh_5", from: "p_vieux_lille", to: "p_roubaix", status: "trip_completed", createdMin: -60 * 48, scheduledMin: null, passengers: 2 },
    { id: "ride_8", customer: "cust_4", driver: "drv_3", vehicle: "veh_7", from: "p_tourcoing", to: "p_croix", status: "trip_completed", createdMin: -60 * 50, scheduledMin: null, passengers: 1 },
    { id: "ride_9", customer: "cust_1", driver: "drv_2", vehicle: "veh_2", from: "p_citadelle", to: "p_lomme", status: "trip_completed", createdMin: -60 * 72, scheduledMin: null, passengers: 1 },
    { id: "ride_10", customer: "cust_2", driver: "drv_1", vehicle: "veh_4", from: "p_wazemmes", to: "p_loos", status: "trip_completed", createdMin: -60 * 96, scheduledMin: null, passengers: 2 },
    { id: "ride_11", customer: "cust_3", driver: "drv_3", vehicle: "veh_6", from: "p_marcq", to: "p_wambrechies", status: "cancelled", createdMin: -60 * 20, scheduledMin: null, passengers: 1, notes: null },
    { id: "ride_12", customer: "cust_4", driver: "drv_2", vehicle: "veh_8", from: "p_lesquin", to: "p_pdb", status: "trip_completed", createdMin: -60 * 120, scheduledMin: null, passengers: 4 },
    { id: "ride_13", customer: "cust_1", driver: null, vehicle: "veh_1", from: "p_vieux_lille", to: "p_lesquin", status: "requested", createdMin: -30, scheduledMin: 60 * 8, passengers: 2, notes: "Départ aéroport tôt le matin" },
    { id: "ride_14", customer: "cust_3", driver: "drv_1", vehicle: "veh_5", from: "p_roubaix", to: "p_vieux_lille", status: "trip_completed", createdMin: -60 * 140, scheduledMin: null, passengers: 1 },
    { id: "ride_15", customer: "cust_2", driver: "drv_3", vehicle: "veh_3", from: "p_lambersart", to: "p_tourcoing", status: "incident_reported", createdMin: -60 * 18, scheduledMin: null, passengers: 1, notes: "Rayure constatée" },
  ];

  const rideRequests: RideRequest[] = [];
  const rideStatusHistory: RideStatusEvent[] = [];
  const payments: Payment[] = [];
  const ratings: Rating[] = [];

  for (const s of rideSpecs) {
    const from = place(s.from);
    const to = place(s.to);
    const route = estimateRoute(from.coordinates, to.coordinates);
    const breakdown = computePrice({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      settings: DEFAULT_PRICING,
      when: new Date(Date.now() + (s.scheduledMin ?? s.createdMin) * 60_000),
    });
    const completed = s.status === "trip_completed";
    const ride: RideRequest = {
      id: s.id,
      customer_id: s.customer,
      driver_id: s.driver,
      vehicle_id: s.vehicle,
      pickup_address: from.address,
      pickup_latitude: from.coordinates.lat,
      pickup_longitude: from.coordinates.lng,
      destination_address: to.address,
      destination_latitude: to.coordinates.lat,
      destination_longitude: to.coordinates.lng,
      scheduled_at: s.scheduledMin != null ? iso(s.scheduledMin) : null,
      passenger_count: s.passengers,
      estimated_distance_km: route.distanceKm,
      estimated_duration_minutes: route.durationMin,
      estimated_driver_arrival_minutes: estimateDriverArrivalMin(2.5),
      estimated_price: breakdown.total,
      final_price: completed ? breakdown.total : null,
      status: s.status,
      customer_notes: s.notes ?? null,
      cancellation_reason: s.status === "cancelled" ? "Client indisponible" : null,
      created_at: iso(s.createdMin),
      updated_at: iso(s.createdMin + 5),
    };
    rideRequests.push(ride);

    // Status history: replay the happy path up to the current status.
    const flowIndex = RIDE_FLOW.indexOf(s.status);
    const path: RideStatus[] = flowIndex >= 0 ? RIDE_FLOW.slice(0, flowIndex + 1) : ["requested", s.status];
    path.forEach((st, i) => {
      rideStatusHistory.push({
        id: `evt_${s.id}_${i}`,
        ride_id: s.id,
        status: st,
        changed_by: i === 0 ? s.customer : s.driver,
        latitude: null,
        longitude: null,
        created_at: iso(s.createdMin + i * 4),
      });
    });

    // Payments for active/completed rides.
    if (completed) {
      payments.push({
        id: `pay_${s.id}`,
        ride_id: s.id,
        customer_id: s.customer,
        stripe_payment_intent_id: `demo_pi_${s.id}`,
        amount: breakdown.total,
        currency: "EUR",
        status: "paid",
        created_at: iso(s.createdMin + route.durationMin),
        updated_at: iso(s.createdMin + route.durationMin + 1),
      });
    } else if (s.status === "trip_in_progress" || s.status === "incident_reported") {
      payments.push({
        id: `pay_${s.id}`,
        ride_id: s.id,
        customer_id: s.customer,
        stripe_payment_intent_id: `demo_pi_${s.id}`,
        amount: breakdown.total,
        currency: "EUR",
        status: "authorized",
        created_at: iso(s.createdMin),
        updated_at: iso(s.createdMin),
      });
    }
  }

  // Ratings on a subset of completed rides.
  const ratingSpecs: Array<{ ride: string; score: number; comment: string | null }> = [
    { ride: "ride_5", score: 5, comment: "Chauffeur ponctuel et rassurant, ma voiture est rentrée sans souci." },
    { ride: "ride_6", score: 5, comment: "Service au top, je recommande pour les sorties." },
    { ride: "ride_7", score: 4, comment: "Très bien, quelques minutes de retard." },
    { ride: "ride_9", score: 5, comment: null },
    { ride: "ride_10", score: 5, comment: "Parfait, vélo rangé proprement dans le coffre." },
    { ride: "ride_14", score: 4, comment: "Conduite prudente, merci." },
  ];
  for (const r of ratingSpecs) {
    const ride = rideRequests.find((x) => x.id === r.ride)!;
    ratings.push({
      id: `rate_${r.ride}`,
      ride_id: r.ride,
      customer_id: ride.customer_id,
      driver_id: ride.driver_id!,
      score: r.score,
      comment: r.comment,
      created_at: iso(-60 * 24),
    });
  }

  /* ---------------- Incidents ---------------- */
  const incidents: Incident[] = [
    {
      id: "inc_1",
      ride_id: "ride_15",
      reported_by: "cust_2",
      incident_type: "vehicle",
      description: "Légère rayure constatée sur l'aile arrière droite à l'arrivée.",
      priority: "high",
      status: "investigating",
      created_at: iso(-60 * 17),
      resolved_at: null,
    },
    {
      id: "inc_2",
      ride_id: "ride_11",
      reported_by: "cust_3",
      incident_type: "behaviour",
      description: "Le chauffeur n'a pas trouvé le point de rendez-vous, course annulée.",
      priority: "low",
      status: "resolved",
      created_at: iso(-60 * 19),
      resolved_at: iso(-60 * 18),
    },
  ];

  /* ---------------- Notifications ---------------- */
  const notifications: StoreState["notifications"] = [
    { id: "ntf_1", user_id: "cust_1", title: "Trajet en cours", body: "Mehdi conduit votre Peugeot 308 vers le Vieux-Lille.", type: "ride", read_at: null, created_at: iso(-20) },
    { id: "ntf_2", user_id: "drv_1", title: "Nouvelle course", body: "Course en cours vers le Vieux-Lille.", type: "ride", read_at: iso(-19), created_at: iso(-34) },
    { id: "ntf_3", user_id: "cust_2", title: "Recherche d'un chauffeur", body: "Nous cherchons un chauffeur Veloop près de Wazemmes.", type: "ride", read_at: null, created_at: iso(-4) },
  ];

  return {
    profiles,
    credentials,
    customerVehicles,
    driverProfiles,
    driverDocuments,
    savedAddresses,
    rideRequests,
    rideStatusHistory,
    vehicleInspections: [],
    inspectionPhotos: [],
    payments,
    ratings,
    incidents,
    pricingSettings: { ...DEFAULT_PRICING, id: "settings_1", updated_at: iso(-60 * 24 * 10) },
    notifications,
  };
}

/* ============================================================
   Veloop — Domain types (mirror of the Postgres schema)
   ============================================================ */

export type UserRole = "customer" | "driver" | "admin";
export type ProfileStatus = "active" | "suspended";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type VerificationStatus = "pending" | "approved" | "rejected";

export type VehicleType = "berline" | "citadine" | "suv" | "break" | "monospace" | "utilitaire";
export type TransmissionType = "manuelle" | "automatique";

export type DocumentType =
  | "permis_recto"
  | "permis_verso"
  | "piece_identite"
  | "justificatif_domicile"
  | "assurance"
  | "photo_velo";

export type RideStatus =
  | "requested"
  | "searching_driver"
  | "driver_assigned"
  | "driver_on_the_way"
  | "driver_arrived"
  | "vehicle_check"
  | "trip_started"
  | "trip_in_progress"
  | "trip_completed"
  | "cancelled"
  | "incident_reported";

export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";

export type IncidentType = "vehicle" | "safety" | "payment" | "behaviour" | "other";
export type IncidentPriority = "low" | "medium" | "high";
export type IncidentStatus = "open" | "investigating" | "resolved";

export type NotificationType = "ride" | "payment" | "driver" | "document" | "system";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface CustomerVehicle {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  registration_number: string;
  color: string;
  vehicle_type: VehicleType;
  transmission_type: TransmissionType;
  notes: string | null;
  created_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  approval_status: ApprovalStatus;
  date_of_birth: string | null;
  driver_license_number: string | null;
  driver_license_expiry: string | null;
  years_of_experience: number;
  folding_bike_confirmed: boolean;
  average_rating: number;
  completed_trips: number;
  is_online: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: DocumentType;
  file_url: string | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface RideRequest {
  id: string;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_address: string;
  destination_latitude: number;
  destination_longitude: number;
  scheduled_at: string | null;
  passenger_count: number;
  estimated_distance_km: number;
  estimated_duration_minutes: number;
  estimated_driver_arrival_minutes: number;
  estimated_price: number;
  final_price: number | null;
  status: RideStatus;
  customer_notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideStatusEvent {
  id: string;
  ride_id: string;
  status: RideStatus;
  changed_by: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface VehicleInspection {
  id: string;
  ride_id: string;
  driver_id: string;
  customer_confirmed: boolean;
  driver_confirmed: boolean;
  driver_confirmed_at: string | null;
  customer_confirmed_at: string | null;
  initial_mileage: number | null;
  final_mileage: number | null;
  notes: string | null;
  created_at: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  photo_type: string;
  file_url: string;
  created_at: string;
}

export interface Payment {
  id: string;
  ride_id: string;
  customer_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  ride_id: string;
  customer_id: string;
  driver_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  ride_id: string | null;
  reported_by: string;
  incident_type: IncidentType;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface PricingSettings {
  id: string;
  base_fee: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_price: number;
  night_multiplier: number;
  surge_multiplier: number;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
}

/* ---------- Ride status state machine ---------- */

export interface RideStatusMeta {
  label: string;
  short: string;
  description: string;
  /** Step index for the visual progress (cancelled/incident are off-track = -1). */
  step: number;
  tone: "neutral" | "active" | "success" | "danger";
}

export const RIDE_STATUS_META: Record<RideStatus, RideStatusMeta> = {
  requested: {
    label: "Demande enregistrée",
    short: "Demande",
    description: "Votre demande de course a bien été enregistrée.",
    step: 0,
    tone: "neutral",
  },
  searching_driver: {
    label: "Recherche d'un chauffeur",
    short: "Recherche",
    description: "Nous recherchons un chauffeur Veloop à proximité.",
    step: 1,
    tone: "active",
  },
  driver_assigned: {
    label: "Chauffeur trouvé",
    short: "Assigné",
    description: "Un chauffeur a accepté votre course.",
    step: 2,
    tone: "active",
  },
  driver_on_the_way: {
    label: "Chauffeur en route",
    short: "En route",
    description: "Votre chauffeur arrive à vélo pliable.",
    step: 3,
    tone: "active",
  },
  driver_arrived: {
    label: "Chauffeur arrivé",
    short: "Arrivé",
    description: "Votre chauffeur est sur place.",
    step: 4,
    tone: "active",
  },
  vehicle_check: {
    label: "Vérification du véhicule",
    short: "Vérif.",
    description: "Vérification du véhicule avant le départ.",
    step: 5,
    tone: "active",
  },
  trip_started: {
    label: "Course démarrée",
    short: "Démarrée",
    description: "Le trajet vient de commencer.",
    step: 6,
    tone: "active",
  },
  trip_in_progress: {
    label: "Trajet en cours",
    short: "En cours",
    description: "Vous êtes en route vers votre destination.",
    step: 7,
    tone: "active",
  },
  trip_completed: {
    label: "Course terminée",
    short: "Terminée",
    description: "Vous êtes arrivé à destination.",
    step: 8,
    tone: "success",
  },
  cancelled: {
    label: "Course annulée",
    short: "Annulée",
    description: "Cette course a été annulée.",
    step: -1,
    tone: "danger",
  },
  incident_reported: {
    label: "Incident signalé",
    short: "Incident",
    description: "Un incident a été signalé sur cette course.",
    step: -1,
    tone: "danger",
  },
};

/** Ordered "happy path" used by the progress component. */
export const RIDE_FLOW: RideStatus[] = [
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_on_the_way",
  "driver_arrived",
  "vehicle_check",
  "trip_started",
  "trip_in_progress",
  "trip_completed",
];

/** Allowed forward transitions (state machine guard). */
export const RIDE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requested: ["searching_driver", "driver_assigned", "cancelled"],
  searching_driver: ["driver_assigned", "cancelled"],
  driver_assigned: ["driver_on_the_way", "cancelled"],
  driver_on_the_way: ["driver_arrived", "cancelled"],
  driver_arrived: ["vehicle_check", "cancelled"],
  vehicle_check: ["trip_started", "cancelled", "incident_reported"],
  trip_started: ["trip_in_progress", "incident_reported"],
  trip_in_progress: ["trip_completed", "incident_reported"],
  trip_completed: [],
  cancelled: [],
  incident_reported: ["resolved" as RideStatus, "trip_in_progress", "cancelled"],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return RIDE_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_on_the_way",
  "driver_arrived",
  "vehicle_check",
  "trip_started",
  "trip_in_progress",
];

/** A ride joined with the related records the UI usually needs. */
export interface RideWithRelations extends RideRequest {
  customer?: Profile;
  driver?: Profile;
  driverProfile?: DriverProfile;
  vehicle?: CustomerVehicle;
  payment?: Payment;
  rating?: Rating;
}

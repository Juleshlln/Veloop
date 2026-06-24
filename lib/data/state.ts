import type {
  CustomerVehicle,
  DriverDocument,
  DriverProfile,
  Incident,
  InspectionPhoto,
  Notification,
  Payment,
  PricingSettings,
  Profile,
  Rating,
  RideRequest,
  RideStatusEvent,
  SavedAddress,
  VehicleInspection,
} from "@/lib/types";

/** Full in-memory database shape for demo mode. Mirrors the Postgres schema. */
export interface StoreState {
  profiles: Profile[];
  /** email -> password, demo only. Never used in production. */
  credentials: Record<string, string>;
  customerVehicles: CustomerVehicle[];
  driverProfiles: DriverProfile[];
  driverDocuments: DriverDocument[];
  savedAddresses: SavedAddress[];
  rideRequests: RideRequest[];
  rideStatusHistory: RideStatusEvent[];
  vehicleInspections: VehicleInspection[];
  inspectionPhotos: InspectionPhoto[];
  payments: Payment[];
  ratings: Rating[];
  incidents: Incident[];
  pricingSettings: PricingSettings;
  notifications: Notification[];
}

import { config, LAUNCH_ZONE } from "./config";
import type { Coordinates } from "./types";

/* ============================================================
   Veloop — Geo layer
   Demo mode: curated Lille-metro POIs for autocomplete + haversine.
   When NEXT_PUBLIC_MAPBOX_TOKEN is set, geocoding/routing can call Mapbox.
   ============================================================ */

export interface GeoPlace {
  id: string;
  label: string;
  address: string;
  coordinates: Coordinates;
}

/** Curated places across the Lille metropolitan area (demo dataset). */
export const DEMO_PLACES: GeoPlace[] = [
  { id: "p_grand_place", label: "Grand-Place", address: "Place du Général de Gaulle, 59000 Lille", coordinates: { lat: 50.6366, lng: 3.0635 } },
  { id: "p_gare_flandres", label: "Gare Lille-Flandres", address: "Place des Buisses, 59000 Lille", coordinates: { lat: 50.6365, lng: 3.0708 } },
  { id: "p_gare_europe", label: "Gare Lille-Europe", address: "Av. Le Corbusier, 59777 Lille", coordinates: { lat: 50.6394, lng: 3.0759 } },
  { id: "p_vieux_lille", label: "Vieux-Lille", address: "Rue de la Monnaie, 59000 Lille", coordinates: { lat: 50.6428, lng: 3.0625 } },
  { id: "p_wazemmes", label: "Marché de Wazemmes", address: "Place de la Nouvelle Aventure, 59000 Lille", coordinates: { lat: 50.6256, lng: 3.0464 } },
  { id: "p_citadelle", label: "Citadelle de Lille", address: "Av. du 43ème Régiment d'Infanterie, 59000 Lille", coordinates: { lat: 50.6411, lng: 3.0466 } },
  { id: "p_eurale", label: "Euralille", address: "Centre commercial Euralille, 59777 Lille", coordinates: { lat: 50.6376, lng: 3.0746 } },
  { id: "p_pdb", label: "Stade Pierre-Mauroy", address: "261 Bd de Tournai, 59650 Villeneuve-d'Ascq", coordinates: { lat: 50.6119, lng: 3.1304 } },
  { id: "p_vda", label: "Villeneuve-d'Ascq — Pont de Bois", address: "Av. du Pont de Bois, 59650 Villeneuve-d'Ascq", coordinates: { lat: 50.6276, lng: 3.1419 } },
  { id: "p_roubaix", label: "Roubaix — Grand-Place", address: "Grand-Place, 59100 Roubaix", coordinates: { lat: 50.6927, lng: 3.1746 } },
  { id: "p_tourcoing", label: "Tourcoing — Centre", address: "Place de la République, 59200 Tourcoing", coordinates: { lat: 50.7236, lng: 3.1611 } },
  { id: "p_lambersart", label: "Lambersart — Canon d'Or", address: "Av. de l'Hippodrome, 59130 Lambersart", coordinates: { lat: 50.6486, lng: 3.0316 } },
  { id: "p_marcq", label: "Marcq-en-Barœul", address: "Av. Foch, 59700 Marcq-en-Barœul", coordinates: { lat: 50.6686, lng: 3.0972 } },
  { id: "p_lomme", label: "Lomme — Lille Sud", address: "Rue de Dunkerque, 59160 Lomme", coordinates: { lat: 50.6419, lng: 3.0117 } },
  { id: "p_loos", label: "Loos — CHU", address: "Rue Michel Polonowski, 59120 Loos", coordinates: { lat: 50.6097, lng: 3.0344 } },
  { id: "p_lesquin", label: "Aéroport Lille-Lesquin", address: "Aéroport, 59810 Lesquin", coordinates: { lat: 50.5733, lng: 3.0894 } },
  { id: "p_croix", label: "Croix — Centre", address: "Place Jean Jaurès, 59170 Croix", coordinates: { lat: 50.6783, lng: 3.1506 } },
  { id: "p_wambrechies", label: "Wambrechies", address: "Place du Général de Gaulle, 59118 Wambrechies", coordinates: { lat: 50.6889, lng: 3.0556 } },
];

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in km. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Road-distance estimate. Straight-line distance scaled by a city detour
 * factor (~1.35) to approximate real road distance.
 */
export function estimateRoadDistanceKm(a: Coordinates, b: Coordinates): number {
  return Math.round(haversineKm(a, b) * 1.35 * 10) / 10;
}

/** Duration estimate from distance, assuming ~24 km/h average urban speed. */
export function estimateDurationMin(distanceKm: number): number {
  const avgSpeedKmh = 24;
  return Math.max(5, Math.round((distanceKm / avgSpeedKmh) * 60));
}

/** Estimated time for a cyclist driver to reach the pickup point. */
export function estimateDriverArrivalMin(distanceFromDriverKm: number): number {
  const bikeSpeedKmh = 16;
  return Math.max(3, Math.round((distanceFromDriverKm / bikeSpeedKmh) * 60));
}

export interface RouteEstimate {
  distanceKm: number;
  durationMin: number;
}

export function estimateRoute(pickup: Coordinates, destination: Coordinates): RouteEstimate {
  const distanceKm = estimateRoadDistanceKm(pickup, destination);
  return { distanceKm, durationMin: estimateDurationMin(distanceKm) };
}

/**
 * Best-available route estimate: real road distance/duration from the Mapbox
 * Directions API when configured, haversine heuristic otherwise. Server-side
 * pricing should use this so the fare reflects the actual route.
 */
export async function estimateRouteReal(pickup: Coordinates, destination: Coordinates): Promise<RouteEstimate> {
  const real = await getDirections(pickup, destination);
  if (real) return { distanceKm: real.distanceKm, durationMin: real.durationMin };
  return estimateRoute(pickup, destination);
}

/** Local search over the demo dataset. */
function searchDemoPlaces(query: string, limit = 6): GeoPlace[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return DEMO_PLACES.slice(0, limit);
  return DEMO_PLACES.filter(
    (p) =>
      p.label.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
  ).slice(0, limit);
}

/**
 * Address autocomplete. Uses Mapbox when configured, otherwise the demo dataset.
 * Always biased to the Lille launch zone.
 */
export async function searchPlaces(query: string, limit = 6): Promise<GeoPlace[]> {
  if (!config.mapbox.enabled) {
    return searchDemoPlaces(query, limit);
  }
  try {
    const { lng, lat } = LAUNCH_ZONE.center;
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set("access_token", config.mapbox.token!);
    url.searchParams.set("proximity", `${lng},${lat}`);
    url.searchParams.set("country", "fr");
    url.searchParams.set("language", "fr");
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return searchDemoPlaces(query, limit);
    const data = (await res.json()) as {
      features: { id: string; text: string; place_name: string; center: [number, number] }[];
    };
    return data.features.map((f) => ({
      id: f.id,
      label: f.text,
      address: f.place_name,
      coordinates: { lat: f.center[1], lng: f.center[0] },
    }));
  } catch {
    return searchDemoPlaces(query, limit);
  }
}

export function findPlaceById(id: string): GeoPlace | undefined {
  return DEMO_PLACES.find((p) => p.id === id);
}

/** Whether a point is within the serviceable launch zone. */
export function isInZone(coords: Coordinates): boolean {
  return haversineKm(coords, LAUNCH_ZONE.center) <= LAUNCH_ZONE.radiusKm;
}

export interface RouteGeometry {
  /** [lng, lat] pairs following the actual road network. */
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
}

/**
 * Real driving route between two points via the Mapbox Directions API.
 * Returns null when no token is configured (caller draws a straight line).
 */
export async function getDirections(from: Coordinates, to: Coordinates): Promise<RouteGeometry | null> {
  if (!config.mapbox.enabled) return null;
  try {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`);
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("access_token", config.mapbox.token!);
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      coordinates: route.geometry.coordinates,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch {
    return null;
  }
}

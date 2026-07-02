"use client";

import * as React from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import type { Coordinates } from "@/lib/types";
import type { Map as MbMap, Marker as MbMarker } from "mapbox-gl";

interface LiveMapProps {
  pickup: Coordinates;
  destination: Coordinates;
  driver?: Coordinates | null;
  className?: string;
  height?: number;
}

function brandColor(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Pin marker element (departure / destination). */
function pinElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)`;
  return el;
}

/** Animated driver marker (pulsing ring + bike dot), glides between positions. */
function driverElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "position:relative;width:26px;height:26px;transition:transform .9s linear";
  el.innerHTML = `
    <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:.35" class="veloop-ping"></span>
    <span style="position:absolute;inset:5px;border-radius:9999px;background:${color};border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></span>`;
  return el;
}

/**
 * Interactive Mapbox map with the real driving route and a live driver marker.
 * Rendered only when a token is configured (MapPreview falls back to SVG).
 * mapbox-gl is imported dynamically so it never runs during SSR.
 */
export function LiveMap({ pickup, destination, driver, className, height = 200 }: LiveMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MbMap | null>(null);
  const driverMarkerRef = React.useRef<MbMarker | null>(null);

  // Init map + route + static markers (re-runs only if pickup/destination change).
  React.useEffect(() => {
    if (!containerRef.current || !config.mapbox.token) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = config.mapbox.token!;

      const primary = brandColor("--primary", "#0d7a5f");
      const accent = brandColor("--accent", "#2fd396");

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [(pickup.lng + destination.lng) / 2, (pickup.lat + destination.lat) / 2],
        zoom: 11,
        attributionControl: false,
        cooperativeGestures: true,
      });
      mapRef.current = map;

      new mapboxgl.Marker({ element: pinElement(primary), anchor: "center" }).setLngLat([pickup.lng, pickup.lat]).addTo(map);
      new mapboxgl.Marker({ element: pinElement("#0b1f1a"), anchor: "center" }).setLngLat([destination.lng, destination.lat]).addTo(map);

      const bounds = new mapboxgl.LngLatBounds([pickup.lng, pickup.lat], [pickup.lng, pickup.lat]).extend([
        destination.lng,
        destination.lat,
      ]);
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });

      // Real road route (falls back to a straight line if the API has none).
      const params = new URLSearchParams({
        fromLat: String(pickup.lat), fromLng: String(pickup.lng),
        toLat: String(destination.lat), toLng: String(destination.lng),
      });
      let line: [number, number][] = [
        [pickup.lng, pickup.lat],
        [destination.lng, destination.lat],
      ];
      try {
        const res = await fetch(`/api/route?${params}`);
        const data = (await res.json()) as { route: { coordinates: [number, number][] } | null };
        if (data.route?.coordinates?.length) line = data.route.coordinates;
      } catch {
        /* keep straight line */
      }
      if (cancelled) return;

      const draw = () => {
        if (!map.getSource("route")) {
          map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } } });
          map.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 8 } });
          map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": primary, "line-width": 4.5 } });
        }
        const b = new mapboxgl.LngLatBounds(line[0], line[0]);
        line.forEach((c) => b.extend(c));
        if (driver) b.extend([driver.lng, driver.lat]);
        map.fitBounds(b, { padding: 56, maxZoom: 14, duration: 0 });
      };
      if (map.loaded()) draw();
      else map.on("load", draw);

      if (driver) {
        driverMarkerRef.current = new mapboxgl.Marker({ element: driverElement(accent), anchor: "center" })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map);
      }
    })();

    return () => {
      cancelled = true;
      driverMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng]);

  // Live driver position: glide the marker to its new coordinates each refresh.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !driver) return;
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driver.lng, driver.lat]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.lat, driver?.lng]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden rounded-2xl border border-border", className)}
      style={{ height }}
    />
  );
}

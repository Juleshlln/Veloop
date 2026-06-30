"use client";

import * as React from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import type { Coordinates } from "@/lib/types";

interface LiveMapProps {
  pickup: Coordinates;
  destination: Coordinates;
  driver?: Coordinates | null;
  className?: string;
  height?: number;
}

/**
 * Real interactive Mapbox map. Rendered only when a token is configured
 * (MapPreview falls back to a schematic SVG otherwise). mapbox-gl is imported
 * dynamically inside the effect so it never runs during SSR.
 */
export function LiveMap({ pickup, destination, driver, className, height = 200 }: LiveMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || !config.mapbox.token) return;
    let map: import("mapbox-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = config.mapbox.token!;

      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [(pickup.lng + destination.lng) / 2, (pickup.lat + destination.lat) / 2],
        zoom: 11,
        attributionControl: false,
        cooperativeGestures: true,
      });

      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2fd396";
      const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#0d7a5f";

      new mapboxgl.Marker({ color: primary }).setLngLat([pickup.lng, pickup.lat]).addTo(map);
      new mapboxgl.Marker({ color: "#0b1f1a" }).setLngLat([destination.lng, destination.lat]).addTo(map);
      if (driver) new mapboxgl.Marker({ color: accent }).setLngLat([driver.lng, driver.lat]).addTo(map);

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickup.lng, pickup.lat]).extend([destination.lng, destination.lat]);
      if (driver) bounds.extend([driver.lng, driver.lat]);
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });

      map.on("load", () => {
        if (!map) return;
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [pickup.lng, pickup.lat],
                [destination.lng, destination.lat],
              ],
            },
          },
        });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": primary, "line-width": 3.5, "line-dasharray": [0.5, 2] },
        });
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [pickup, destination, driver]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden rounded-2xl border border-border", className)}
      style={{ height }}
    />
  );
}

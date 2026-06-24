import { MapPin, Flag, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/lib/types";

interface MapPreviewProps {
  pickup: Coordinates;
  destination: Coordinates;
  driver?: Coordinates | null;
  className?: string;
  height?: number;
}

const W = 320;
const H = 200;
const PAD = 36;

/**
 * Lightweight schematic map for demo mode (no Mapbox key required).
 * Projects pickup/destination/driver into an SVG bounding box.
 */
export function MapPreview({ pickup, destination, driver, className, height = 200 }: MapPreviewProps) {
  const points = [pickup, destination, ...(driver ? [driver] : [])];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 0.005);
  const spanLng = Math.max(maxLng - minLng, 0.005);

  const project = (c: Coordinates) => ({
    x: PAD + ((c.lng - minLng) / spanLng) * (W - 2 * PAD),
    y: PAD + (1 - (c.lat - minLat) / spanLat) * (H - 2 * PAD),
  });

  const a = project(pickup);
  const b = project(destination);
  const d = driver ? project(driver) : null;
  // gentle curve control point
  const cx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18;
  const cy = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;

  return (
    <div
      className={cn("veloop-map-grid relative overflow-hidden rounded-2xl border border-border", className)}
      style={{ height }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="size-full" preserveAspectRatio="xMidYMid slice">
        <path
          d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1 9"
          opacity="0.85"
        />
        {/* pickup */}
        <g transform={`translate(${a.x}, ${a.y})`}>
          <circle r="9" fill="var(--primary)" opacity="0.18" />
          <circle r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
        </g>
        {/* destination */}
        <g transform={`translate(${b.x}, ${b.y})`}>
          <circle r="9" fill="#0b1f1a" opacity="0.14" />
          <circle r="5" fill="#0b1f1a" stroke="white" strokeWidth="2" />
        </g>
        {/* driver */}
        {d && (
          <g transform={`translate(${d.x}, ${d.y})`}>
            <circle r="11" fill="var(--accent)" opacity="0.25" />
            <circle r="8" fill="var(--accent)" stroke="white" strokeWidth="2" />
          </g>
        )}
      </svg>

      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-primary backdrop-blur">
        <MapPin className="size-3" /> Départ
      </span>
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
        <Flag className="size-3" /> Arrivée
      </span>
      {driver && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">
          <Bike className="size-3" /> Chauffeur
        </span>
      )}
    </div>
  );
}

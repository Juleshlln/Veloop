import { cn } from "@/lib/utils";

const CITIES = [
  { name: "Lille", x: 150, y: 150, primary: true },
  { name: "Lambersart", x: 110, y: 130 },
  { name: "Marcq-en-Barœul", x: 178, y: 110 },
  { name: "Villeneuve-d'Ascq", x: 215, y: 165 },
  { name: "Roubaix", x: 240, y: 95 },
  { name: "Tourcoing", x: 225, y: 60 },
  { name: "Lesquin", x: 175, y: 205 },
  { name: "Loos", x: 120, y: 180 },
];

/** Stylized map of the Lille metropolitan launch zone. */
export function ZoneMap({ className }: { className?: string }) {
  return (
    <div className={cn("veloop-map-grid relative overflow-hidden rounded-3xl border border-border", className)}>
      <svg viewBox="0 0 320 260" className="size-full" preserveAspectRatio="xMidYMid meet">
        {/* zone area */}
        <circle cx="165" cy="135" r="105" fill="var(--primary)" opacity="0.06" />
        <circle cx="165" cy="135" r="105" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="3 7" opacity="0.5" />

        {/* connections */}
        {CITIES.filter((c) => !c.primary).map((c) => (
          <line key={`l-${c.name}`} x1="150" y1="150" x2={c.x} y2={c.y} stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="1 6" opacity="0.45" />
        ))}

        {CITIES.map((c) => (
          <g key={c.name} transform={`translate(${c.x}, ${c.y})`}>
            {c.primary ? (
              <>
                <circle r="9" fill="var(--primary)" opacity="0.2" />
                <circle r="6" fill="var(--primary)" stroke="white" strokeWidth="2" />
              </>
            ) : (
              <circle r="4" fill="var(--accent)" stroke="white" strokeWidth="1.5" />
            )}
            <text
              x="0"
              y={c.primary ? -14 : -9}
              textAnchor="middle"
              className={cn("fill-foreground", c.primary ? "text-[11px] font-bold" : "text-[9px] font-medium")}
            >
              {c.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

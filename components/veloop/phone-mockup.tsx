import { Bike, Star, ShieldCheck } from "lucide-react";

/**
 * Premium device mockup showing a Veloop tracking screen.
 * Pure presentational — illustrates the product on the landing page.
 */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-primary/10 blur-2xl" aria-hidden />
      <div className="rounded-[2.6rem] border-[10px] border-[#0b1f1a] bg-[#0b1f1a] shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-background">
          {/* notch */}
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0b1f1a]" />

          {/* map area */}
          <div className="veloop-map-grid relative h-44 w-full">
            <svg viewBox="0 0 300 176" className="size-full" preserveAspectRatio="xMidYMid slice">
              <path
                d="M40 140 Q 120 90 160 96 T 250 44"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="1 10"
              />
              <g transform="translate(40,140)">
                <circle r="10" fill="var(--primary)" opacity="0.18" />
                <circle r="5.5" fill="var(--primary)" stroke="white" strokeWidth="2" />
              </g>
              <g transform="translate(250,44)">
                <circle r="10" fill="#0b1f1a" opacity="0.15" />
                <circle r="5.5" fill="#0b1f1a" stroke="white" strokeWidth="2" />
              </g>
              <g transform="translate(160,96)">
                <circle r="13" fill="var(--accent)" opacity="0.25" />
                <circle r="9" fill="var(--accent)" stroke="white" strokeWidth="2.5" />
              </g>
            </svg>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">
              <Bike className="size-3" /> 4 min
            </span>
          </div>

          {/* sheet */}
          <div className="space-y-3 p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
              <span className="size-1.5 rounded-full bg-primary veloop-ping" /> Chauffeur en route
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                MC
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-foreground">Mehdi</p>
                  <ShieldCheck className="size-3.5 text-primary" />
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-amber-400 text-amber-400" /> 4,9 · 132 courses
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Estimé</p>
                <p className="text-sm font-extrabold text-foreground">35,40 €</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
              <span className="text-sm font-semibold">Peugeot 308 · FA-123-BC</span>
              <span className="text-xs opacity-80">Vieux-Lille</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

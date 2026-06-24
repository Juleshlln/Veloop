import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  withWordmark?: boolean;
  /** "color" uses brand green, "current" inherits text color (e.g. on dark bg). */
  tone?: "color" | "current";
}

/**
 * Veloop mark — a continuous loop (the "retour") that closes on itself,
 * with a node marking the start/end point of the journey.
 */
export function LogoMark({ className, tone = "color" }: { className?: string; tone?: "color" | "current" }) {
  const stroke = tone === "color" ? "var(--primary)" : "currentColor";
  const accent = tone === "color" ? "var(--accent)" : "currentColor";
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("size-9", className)} aria-hidden>
      <path
        d="M20 5.5c8.008 0 14.5 6.492 14.5 14.5S28.008 34.5 20 34.5 5.5 28.008 5.5 20c0-5.4 2.953-10.11 7.333-12.604"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="12.8" cy="7.4" r="3.4" fill={accent} />
    </svg>
  );
}

export function Logo({ className, markClassName, withWordmark = true, tone = "color" }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} tone={tone} />
      {withWordmark && (
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight",
            tone === "color" ? "text-foreground" : "text-current",
          )}
        >
          Veloop
        </span>
      )}
    </span>
  );
}

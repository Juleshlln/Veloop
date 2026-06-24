import { FlaskConical } from "lucide-react";
import { IS_DEMO } from "@/lib/config";

/**
 * Visible marker that the app is running on simulated data (no API keys).
 * Rendered at the top of authenticated spaces.
 */
export function DemoBanner({ className }: { className?: string }) {
  if (!IS_DEMO) return null;
  return (
    <div
      className={`flex items-center justify-center gap-2 bg-[#0b1f1a] px-4 py-1.5 text-center text-xs font-medium text-white/90 ${className ?? ""}`}
    >
      <FlaskConical className="size-3.5 text-accent" />
      <span>
        Mode démonstration — données simulées, paiements Stripe et carte non connectés.
      </span>
    </div>
  );
}

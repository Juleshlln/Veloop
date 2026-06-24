import { cn, formatEuro } from "@/lib/utils";
import type { PriceBreakdown as PriceBreakdownType } from "@/lib/pricing";

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  className?: string;
  estimate?: boolean;
}

export function PriceBreakdown({ breakdown, className, estimate = true }: PriceBreakdownProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {breakdown.lines.map((line, i) => (
        <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
          <div className="min-w-0">
            <span className="text-foreground">{line.label}</span>
            {line.hint && <span className="ml-2 text-xs text-muted-foreground">{line.hint}</span>}
          </div>
          <span className={cn("font-medium tabular-nums", line.amount < 0 ? "text-success" : "text-foreground")}>
            {line.amount < 0 ? "−" : ""}
            {formatEuro(Math.abs(line.amount))}
          </span>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-base font-bold text-foreground">
          {estimate ? "Total estimé" : "Total"}
        </span>
        <span className="text-xl font-extrabold tabular-nums text-foreground">
          {formatEuro(breakdown.total)}
        </span>
      </div>
      {estimate && (
        <p className="text-xs text-muted-foreground">
          Montant estimé avant confirmation. Le prix final est calculé à la fin de la course.
        </p>
      )}
    </div>
  );
}

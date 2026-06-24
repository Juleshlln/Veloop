import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RIDE_FLOW, RIDE_STATUS_META, type RideStatus } from "@/lib/types";

const VISIBLE_STEPS: RideStatus[] = [
  "searching_driver",
  "driver_assigned",
  "driver_on_the_way",
  "driver_arrived",
  "vehicle_check",
  "trip_in_progress",
  "trip_completed",
];

export function RideProgress({ status }: { status: RideStatus }) {
  if (status === "cancelled" || status === "incident_reported") {
    const meta = RIDE_STATUS_META[status];
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#f6d4d9] bg-[#fdeaed] p-4">
        <AlertTriangle className="size-5 shrink-0 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">{meta.label}</p>
          <p className="text-sm text-destructive/80">{meta.description}</p>
        </div>
      </div>
    );
  }

  const currentStep = RIDE_STATUS_META[status].step;

  return (
    <ol className="relative space-y-1">
      {VISIBLE_STEPS.map((step, index) => {
        const meta = RIDE_STATUS_META[step];
        const done = currentStep > meta.step;
        const active = currentStep === meta.step || (status === step);
        const isLast = index === VISIBLE_STEPS.length - 1;
        return (
          <li key={step} className="relative flex gap-3 pb-4">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-full w-0.5",
                  done ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && !done && "border-primary bg-primary-soft text-primary",
                !done && !active && "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-4" />
              ) : active ? (
                <span className="size-2.5 rounded-full bg-primary veloop-ping" />
              ) : (
                <span className="size-2 rounded-full bg-current opacity-40" />
              )}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-semibold", active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>
                {meta.label}
              </p>
              {active && <p className="text-sm text-muted-foreground">{meta.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

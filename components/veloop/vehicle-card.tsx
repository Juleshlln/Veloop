import { Car, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerVehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: CustomerVehicle;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function VehicleCard({ vehicle, selected, onSelect, className }: VehicleCardProps) {
  const interactive = Boolean(onSelect);
  const Cmp = interactive ? "button" : "div";
  return (
    <Cmp
      type={interactive ? "button" : undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-border bg-card",
        interactive && "hover:border-primary/50",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Car className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {vehicle.color} · {vehicle.registration_number} · {vehicle.transmission_type}
        </p>
      </div>
      {selected && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
      )}
    </Cmp>
  );
}

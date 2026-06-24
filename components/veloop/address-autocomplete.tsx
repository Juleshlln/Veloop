"use client";

import * as React from "react";
import { MapPin, Loader2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { GeoPlace } from "@/lib/geo";

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: GeoPlace | null;
  onChange: (place: GeoPlace | null) => void;
  dotColor?: string;
  id?: string;
}

export function AddressAutocomplete({
  label,
  placeholder = "Saisir une adresse",
  value,
  onChange,
  dotColor = "var(--primary)",
  id,
}: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState(value?.address ?? "");
  const [results, setResults] = React.useState<GeoPlace[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setQuery(value?.address ?? "");
  }, [value]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = (await res.json()) as { places: GeoPlace[] };
        setResults(data.places);
        setActive(0);
      } catch {
        /* ignored (abort) */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, open]);

  function select(place: GeoPlace) {
    onChange(place);
    setQuery(place.address);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <Label htmlFor={id} className="mb-1.5 block">
          {label}
        </Label>
      )}
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 size-2.5 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <input
          id={id}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              select(results[active]);
            }
          }}
          className="flex h-12 w-full rounded-xl border border-input bg-background pl-9 pr-10 text-base text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : value ? (
          <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        ) : null}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">
          {results.map((place, i) => (
            <li key={place.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => select(place)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  i === active ? "bg-subtle" : "hover:bg-subtle",
                )}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{place.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{place.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

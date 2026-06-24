"use client";

import * as React from "react";
import { CheckCircle2, Info, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

/* Minimal external store so `toast()` can be called from anywhere. */
let counter = 0;
let listeners: Array<(toasts: ToastItem[]) => void> = [];
let toasts: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function toast(input: { title: string; description?: string; tone?: ToastTone }) {
  const item: ToastItem = {
    id: ++counter,
    title: input.title,
    description: input.description,
    tone: input.tone ?? "info",
  };
  toasts = [...toasts, item];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== item.id);
    emit();
  }, 4200);
}

const TONE_META: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  error: { icon: XCircle, className: "text-destructive" },
  warning: { icon: AlertTriangle, className: "text-warning" },
  info: { icon: Info, className: "text-primary" },
};

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const listener = (next: ToastItem[]) => setItems([...next]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {items.map((item) => {
        const { icon: Icon, className } = TONE_META[item.tone];
        return (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg"
            role="status"
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", className)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

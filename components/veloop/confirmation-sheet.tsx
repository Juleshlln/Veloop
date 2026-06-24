"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  tone?: "default" | "destructive";
  hideActions?: boolean;
}

export function ConfirmationSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  loading,
  tone = "default",
  hideActions,
}: ConfirmationSheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in"
        onClick={() => !loading && onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-card p-5 pb-safe shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        <button
          onClick={() => !loading && onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-subtle"
          aria-label="Fermer"
        >
          <X className="size-5" />
        </button>
        <h2 className="pr-8 text-lg font-bold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        {!hideActions && (
          <div className="mt-6 flex flex-col gap-2">
            {onConfirm && (
              <Button
                size="lg"
                variant={tone === "destructive" ? "destructive" : "default"}
                onClick={() => onConfirm()}
                disabled={loading}
              >
                {loading ? <Spinner className={cn("text-current")} /> : confirmLabel}
              </Button>
            )}
            <Button size="lg" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

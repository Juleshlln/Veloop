"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  label?: string;
  /** "button" = full outline button (profile pages) · "icon" = compact header button. */
  variant?: "button" | "icon";
}

export function SignOutButton({ className, label = "Se déconnecter", variant = "button" }: SignOutButtonProps) {
  if (variant === "icon") {
    return (
      <form action={signOutAction} className="flex">
        <Button type="submit" variant="ghost" size="icon" aria-label={label} title={label} className={className}>
          <LogOut className="text-muted-foreground" />
        </Button>
      </form>
    );
  }

  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" className={cn("w-full", className)}>
        <LogOut /> {label}
      </Button>
    </form>
  );
}

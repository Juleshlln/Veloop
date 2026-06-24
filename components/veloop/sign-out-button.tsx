"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, label = "Se déconnecter" }: { className?: string; label?: string }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" className={cn("w-full", className)}>
        <LogOut /> {label}
      </Button>
    </form>
  );
}

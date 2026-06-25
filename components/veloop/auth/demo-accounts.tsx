"use client";

import * as React from "react";
import { User, Bike, ShieldCheck } from "lucide-react";
import { demoSignInAction } from "@/lib/auth/actions";
import { Spinner } from "@/components/ui/spinner";

const ACCOUNTS = [
  { role: "customer" as const, label: "Client", icon: User, email: "client@veloop.fr" },
  { role: "driver" as const, label: "Chauffeur", icon: Bike, email: "chauffeur@veloop.fr" },
  { role: "admin" as const, label: "Admin", icon: ShieldCheck, email: "admin@veloop.fr" },
];

/** One-click sign-in for the seeded demo accounts (work in both demo and Supabase modes). */
export function DemoAccounts() {
  const [pending, setPending] = React.useState<string | null>(null);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">Connexion démo en 1 clic</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.role}
            disabled={pending !== null}
            onClick={async () => {
              setPending(a.role);
              await demoSignInAction(a.role);
            }}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 disabled:opacity-60"
          >
            {pending === a.role ? <Spinner className="size-5" /> : <a.icon className="size-5 text-primary" />}
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Mot de passe : veloop123</p>
    </div>
  );
}

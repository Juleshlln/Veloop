"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Bike, Users, CreditCard, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Courses", href: "/admin/courses", icon: Route },
  { label: "Chauffeurs", href: "/admin/chauffeurs", icon: Bike },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Paiements", href: "/admin/paiements", icon: CreditCard },
  { label: "Incidents", href: "/admin/incidents", icon: ShieldAlert },
  { label: "Tarification", href: "/admin/tarification", icon: SlidersHorizontal },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1.5 md:flex-col">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-subtle hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

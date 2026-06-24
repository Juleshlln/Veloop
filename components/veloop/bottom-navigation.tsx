"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, PlusCircle, Clock, Car, User,
  LayoutDashboard, Wallet, FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

/* Nav sets live here (client) so icon components never cross the RSC boundary. */
const NAVS: Record<"client" | "driver", NavItem[]> = {
  client: [
    { label: "Accueil", href: "/app", icon: Home, exact: true },
    { label: "Commander", href: "/app/nouvelle-course", icon: PlusCircle },
    { label: "Courses", href: "/app/historique", icon: Clock },
    { label: "Véhicules", href: "/app/vehicules", icon: Car },
    { label: "Profil", href: "/app/profil", icon: User },
  ],
  driver: [
    { label: "Tableau", href: "/driver", icon: LayoutDashboard, exact: true },
    { label: "Courses", href: "/driver/historique", icon: Clock },
    { label: "Gains", href: "/driver/gains", icon: Wallet },
    { label: "Documents", href: "/driver/documents", icon: FileText },
    { label: "Profil", href: "/driver/profil", icon: User },
  ],
};

export function BottomNavigation({ variant }: { variant: "client" | "driver" }) {
  const pathname = usePathname();
  const items = NAVS[variant];

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-card/95 pb-safe backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.4]")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

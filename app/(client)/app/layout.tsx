import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/data/store";
import { Logo } from "@/components/veloop/logo";
import { DemoBanner } from "@/components/veloop/demo-banner";
import { NotificationBell } from "@/components/veloop/notification-bell";
import { BottomNavigation } from "@/components/veloop/bottom-navigation";
import { SignOutButton } from "@/components/veloop/sign-out-button";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("customer");
  const notifications = await db.listNotifications(user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-subtle">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/app" aria-label="Accueil">
            <Logo />
          </Link>
          <div className="flex items-center gap-0.5">
            <NotificationBell notifications={notifications} />
            <SignOutButton variant="icon" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">{children}</main>

      <BottomNavigation variant="client" />
    </div>
  );
}

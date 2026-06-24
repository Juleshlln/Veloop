import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { Logo } from "@/components/veloop/logo";
import { DemoBanner } from "@/components/veloop/demo-banner";
import { AdminNav } from "@/components/veloop/admin/admin-nav";
import { SignOutButton } from "@/components/veloop/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");

  return (
    <div className="flex min-h-dvh flex-col bg-subtle">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2" aria-label="Administration">
            <Logo />
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase text-background">Admin</span>
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.first_name} {user.last_name}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <div className="sticky top-20 space-y-4">
            <AdminNav />
            <div className="hidden md:block">
              <SignOutButton label="Déconnexion" />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}

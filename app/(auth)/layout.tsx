import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/veloop/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-subtle">
      <header className="mx-auto flex w-full max-w-md items-center justify-between p-4">
        <Link href="/" aria-label="Accueil Veloop">
          <Logo />
        </Link>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Accueil
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

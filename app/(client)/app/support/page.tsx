import { Mail, Phone, LifeBuoy } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { SupportForm } from "@/components/veloop/support-form";
import { EmergencyButton } from "@/components/veloop/emergency-button";

export const metadata = { title: "Support" };

export default async function SupportPage() {
  await requireRole("customer");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">Une question ou un problème ? Nous sommes là pour vous aider.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a href="mailto:support@veloop.fr" className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <Mail className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">E-mail</p>
            <p className="text-xs text-muted-foreground">support@veloop.fr</p>
          </div>
        </a>
        <a href="tel:+33000000000" className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <Phone className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Téléphone</p>
            <p className="text-xs text-muted-foreground">Service client</p>
          </div>
        </a>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <LifeBuoy className="size-4 text-primary" /> Nous contacter
      </div>
      <SupportForm />

      <Card className="flex items-center justify-between gap-3 border-[#f6d4d9] bg-[#fdeaed] p-4">
        <p className="text-sm text-destructive">En cas de danger immédiat, utilisez le bouton d&apos;urgence.</p>
        <EmergencyButton variant="inline" />
      </Card>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Bike, Wallet, Clock, ShieldCheck, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/veloop/page-hero";

export const metadata = { title: "Devenir chauffeur" };

const PERKS = [
  { icon: Clock, title: "Horaires flexibles", text: "Passez en ligne quand vous le souhaitez, acceptez les courses qui vous conviennent." },
  { icon: Wallet, title: "Rémunération transparente", text: "Visualisez la rémunération estimée avant d'accepter chaque course." },
  { icon: Bike, title: "Mobilité douce", text: "Vous rejoignez les clients à vélo pliable, une activité urbaine et responsable." },
];

const STEPS = [
  "Créez votre compte chauffeur",
  "Complétez votre profil et confirmez votre vélo pliable",
  "Transmettez vos documents (permis, identité)",
  "Validation manuelle par notre équipe",
  "Passez en ligne et recevez vos premières courses",
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Rejoindre Veloop"
        title="Devenez chauffeur Veloop"
        subtitle="Raccompagnez les Lillois avec leur propre voiture, à votre rythme."
      />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <p.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Comment rejoindre</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <span className="text-sm text-foreground">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#fbe7c6] bg-[#fdf6e9] p-5">
          <FileCheck className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm text-[#7a5a17]">
            Les conditions d&apos;exercice, assurances et obligations réglementaires liées au raccompagnement
            de véhicules doivent être validées avant tout démarrage d&apos;activité.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/inscription">
              <ShieldCheck /> Créer mon compte chauffeur <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

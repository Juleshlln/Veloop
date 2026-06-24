import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Bike,
  Car,
  ShieldCheck,
  Route,
  CreditCard,
  History,
  UserCheck,
  PartyPopper,
  Moon,
  Briefcase,
  Utensils,
  Heart,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/veloop/phone-mockup";
import { ZoneMap } from "@/components/veloop/zone-map";
import { LAUNCH_ZONE } from "@/lib/config";

export const metadata = {
  description:
    "Veloop vous raccompagne avec votre propre voiture. Un chauffeur vous rejoint à vélo pliable, prend le volant et vous ramène en sécurité. Lille & métropole.",
};

const STEPS = [
  { icon: MapPin, title: "Indiquez votre destination", text: "Adresse de départ, adresse d'arrivée, et confirmez que votre voiture est sur place." },
  { icon: Bike, title: "Un chauffeur vous rejoint à vélo", text: "Un chauffeur Veloop vérifié arrive à vélo pliable au point de rendez-vous." },
  { icon: Car, title: "Son vélo entre dans votre coffre", text: "Le vélo pliable est rangé dans le coffre, vous montez à bord de votre véhicule." },
  { icon: Route, title: "Vous rentrez avec votre voiture", text: "Le chauffeur vous raccompagne, récupère son vélo à l'arrivée et repart." },
];

const USE_CASES = [
  { icon: Moon, label: "Retour de soirée" },
  { icon: Sparkles, label: "Fatigue au volant" },
  { icon: Briefcase, label: "Événement professionnel" },
  { icon: Utensils, label: "Restaurant" },
  { icon: PartyPopper, label: "Mariage" },
  { icon: Heart, label: "Indisponibilité temporaire" },
  { icon: Car, label: "Raccompagner un véhicule" },
];

const SAFETY = [
  { icon: UserCheck, title: "Chauffeurs vérifiés", text: "Validation manuelle des documents avant toute course." },
  { icon: Route, title: "Suivi du trajet", text: "Statuts en temps quasi réel et partage de votre course." },
  { icon: Car, title: "Vérification du véhicule", text: "Checklist et photos avant le départ, à deux." },
  { icon: ShieldCheck, title: "Assistance & urgence", text: "Bouton d'urgence et signalement accessibles à tout moment." },
  { icon: CreditCard, title: "Paiement sécurisé", text: "Paiement intégré et reçu automatique après la course." },
  { icon: History, title: "Historique complet", text: "Toutes vos courses, reçus et évaluations conservés." },
];

export default function LandingPage() {
  return (
    <>
      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft/50 to-background" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-primary">
              <Bike className="size-3.5" /> {LAUNCH_ZONE.name}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Rentrez avec<br />votre voiture.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Un chauffeur vous rejoint à vélo pliable, prend le volant de votre véhicule
              et vous raccompagne en toute sécurité.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/app/nouvelle-course">
                  Commander un chauffeur <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#fonctionnement">Découvrir le service</Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" /> Chauffeurs vérifiés</span>
              <span className="inline-flex items-center gap-1.5"><CreditCard className="size-4 text-primary" /> Paiement sécurisé</span>
            </div>
          </div>
          <div className="flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* 2. FONCTIONNEMENT */}
      <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Comment ça marche</h2>
          <p className="mt-3 text-muted-foreground">Quatre étapes simples, du départ jusqu&apos;à votre porte.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-border bg-card p-5">
              <span className="absolute right-5 top-5 text-3xl font-extrabold text-primary-soft">{i + 1}</span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CAS D'USAGE */}
      <section className="bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Quand utiliser Veloop ?</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {USE_CASES.map((u) => (
              <span key={u.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground">
                <u.icon className="size-4 text-primary" /> {u.label}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
            Veloop ne se substitue pas aux services de secours. Si une personne est en détresse ou
            nécessite une assistance médicale, contactez les services d&apos;urgence appropriés.
          </p>
        </div>
      </section>

      {/* 4. SÉCURITÉ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">La confiance, au cœur du service</h2>
          <p className="mt-3 text-muted-foreground">Tout est pensé pour que vous et votre voiture arriviez en sécurité.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ZONE DE LANCEMENT */}
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="size-3.5" /> Zone de lancement
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
              Disponible à Lille<br />et sa métropole
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Nous démarrons sur la Métropole Européenne de Lille pour offrir un service fiable
              et des temps d&apos;attente courts. D&apos;autres villes suivront.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/devenir-chauffeur">Devenir chauffeur Veloop <ArrowRight /></Link>
            </Button>
          </div>
          <ZoneMap className="h-[300px] w-full" />
        </div>
      </section>

      {/* 6. CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1f1a] px-6 py-14 text-center text-white sm:px-12">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
            Votre voiture aussi doit rentrer.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/70">
            Testez Veloop dès maintenant en mode démonstration, sans configuration.
          </p>
          <Button asChild size="lg" variant="accent" className="relative mt-7">
            <Link href="/inscription">Tester Veloop <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}

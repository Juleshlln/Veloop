import Link from "next/link";
import { MapPin, Bike, Car, Route, ArrowRight, ClipboardCheck, CreditCard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/veloop/page-hero";

export const metadata = { title: "Comment ça marche" };

const STEPS = [
  { icon: MapPin, title: "1. Indiquez votre trajet", text: "Saisissez votre adresse de départ et de destination, confirmez que votre voiture est sur place, choisissez « maintenant » ou planifiez." },
  { icon: CreditCard, title: "2. Recevez une estimation", text: "Distance, durée, temps d'arrivée du chauffeur et prix détaillé s'affichent. Vous confirmez en un geste." },
  { icon: Bike, title: "3. Un chauffeur vous rejoint", text: "Un chauffeur Veloop vérifié arrive à vélo pliable au point de rendez-vous indiqué." },
  { icon: ClipboardCheck, title: "4. Vérification du véhicule", text: "Ensemble, vous vérifiez l'état du véhicule, prenez quelques photos et confirmez la remise des clés." },
  { icon: Car, title: "5. Le vélo entre dans le coffre", text: "Le vélo pliable est rangé dans le coffre. Le chauffeur prend le volant de votre véhicule." },
  { icon: Route, title: "6. Vous rentrez en sécurité", text: "Le chauffeur vous raccompagne, le paiement se fait automatiquement, puis il récupère son vélo et repart." },
  { icon: Star, title: "7. Vous évaluez la course", text: "Notez votre chauffeur et retrouvez le reçu dans votre historique." },
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Le service"
        title="Comment ça marche"
        subtitle="Veloop raccompagne les personnes avec leur propre voiture. Voici le déroulé complet d'une course."
      />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <ol className="space-y-5">
          {STEPS.map((s) => (
            <li key={s.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <s.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/app/nouvelle-course">Commander un chauffeur <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}

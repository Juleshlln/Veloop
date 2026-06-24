import { UserCheck, Route, Car, ShieldCheck, CreditCard, History, ShieldAlert, FileCheck } from "lucide-react";
import { PageHero } from "@/components/veloop/page-hero";

export const metadata = { title: "Sécurité" };

const ITEMS = [
  { icon: UserCheck, title: "Chauffeurs vérifiés", text: "Chaque chauffeur transmet ses documents (permis, identité). La validation est effectuée manuellement avant toute course." },
  { icon: Car, title: "Vérification du véhicule", text: "Avant le départ, client et chauffeur confirment ensemble l'état du véhicule et peuvent ajouter des photos." },
  { icon: Route, title: "Suivi du trajet", text: "Les statuts de la course évoluent étape par étape et peuvent être partagés avec un proche." },
  { icon: ShieldAlert, title: "Bouton d'urgence", text: "Un accès rapide aux services d'urgence et au signalement reste disponible pendant toute la course." },
  { icon: CreditCard, title: "Paiement sécurisé", text: "Le paiement est intégré et un reçu est généré automatiquement. Aucune donnée bancaire n'est stockée en clair." },
  { icon: History, title: "Historique & traçabilité", text: "Chaque course conserve son historique de statuts, son reçu et son évaluation." },
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Confiance"
        title="Votre sécurité, notre priorité"
        subtitle="Tout est pensé pour que vous et votre voiture arriviez à destination en toute sérénité."
      />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((i) => (
            <div key={i.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <i.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{i.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{i.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#fbe7c6] bg-[#fdf6e9] p-5">
          <FileCheck className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm text-[#7a5a17]">
            <strong>Avant lancement commercial.</strong> Veloop est en phase de validation (MVP).
            Les assurances, responsabilités, conditions d&apos;exercice, documents nécessaires et règles
            réglementaires applicables au raccompagnement de véhicules doivent être validés avant toute
            exploitation commerciale. Aucune garantie d&apos;assurance n&apos;est promise à ce stade.
          </p>
        </div>
      </section>
    </>
  );
}

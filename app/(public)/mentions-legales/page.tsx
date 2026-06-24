import { LegalPage } from "@/components/veloop/legal-page";

export const metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage
      title="Mentions légales"
      updatedAt="24 juin 2026"
      sections={[
        { heading: "Éditeur", body: ["Veloop (MVP). Société en cours de constitution. Coordonnées et numéro d'immatriculation à compléter avant le lancement commercial."] },
        { heading: "Directeur de la publication", body: ["À compléter."] },
        { heading: "Hébergement", body: ["Application hébergée sur Vercel. Base de données et authentification gérées via Supabase."] },
        { heading: "Contact", body: ["contact@veloop.fr"] },
      ]}
    />
  );
}

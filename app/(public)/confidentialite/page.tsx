import { LegalPage } from "@/components/veloop/legal-page";

export const metadata = { title: "Confidentialité" };

export default function Page() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt="24 juin 2026"
      sections={[
        { heading: "Données collectées", body: ["Identité, coordonnées, adresses de course, informations de véhicule, historique des courses et évaluations. Les chauffeurs transmettent en plus des documents justificatifs."] },
        { heading: "Finalités", body: ["Les données sont utilisées pour fournir le service de raccompagnement, affecter les chauffeurs, gérer les paiements et assurer la sécurité des trajets."] },
        { heading: "Conservation", body: ["Les données sont conservées le temps nécessaire à la fourniture du service et aux obligations légales applicables."] },
        { heading: "Vos droits", body: ["Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression. Contact : contact@veloop.fr. Le détail des traitements doit être finalisé avant le lancement commercial."] },
      ]}
    />
  );
}

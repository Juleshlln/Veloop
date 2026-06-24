import { LegalPage } from "@/components/veloop/legal-page";

export const metadata = { title: "Conditions" };

export default function Page() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      updatedAt="24 juin 2026"
      sections={[
        { heading: "Objet", body: ["Veloop met en relation des clients souhaitant être raccompagnés avec leur propre véhicule et des chauffeurs se déplaçant à vélo pliable."] },
        { heading: "Conditions client", body: ["Le client déclare disposer d'un véhicule en état de circuler, assuré et dont le coffre peut accueillir un vélo pliable. Le client doit être en capacité de consentir à la prestation."] },
        { heading: "Conditions chauffeur", body: ["Le chauffeur doit disposer d'un permis valide et des autorisations nécessaires. La validation est effectuée manuellement par Veloop."] },
        { heading: "Paiement", body: ["Le prix estimé est affiché avant confirmation. Le montant final est calculé à la fin de la course et prélevé via le prestataire de paiement."] },
        { heading: "Responsabilité", body: ["Les conditions de responsabilité et d'assurance doivent être contractualisées avant tout lancement commercial. Aucune garantie d'assurance n'est promise dans le cadre du MVP."] },
      ]}
    />
  );
}

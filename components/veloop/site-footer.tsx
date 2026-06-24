import Link from "next/link";
import { Logo } from "./logo";
import { LAUNCH_ZONE } from "@/lib/config";

const COLUMNS = [
  {
    title: "Service",
    links: [
      { label: "Comment ça marche", href: "/comment-ca-marche" },
      { label: "Tarifs", href: "/tarifs" },
      { label: "Sécurité", href: "/securite" },
      { label: "Devenir chauffeur", href: "/devenir-chauffeur" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "Conditions", href: "/conditions" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Se connecter", href: "/connexion" },
      { label: "Créer un compte", href: "/inscription" },
      { label: "Contact", href: "mailto:contact@veloop.fr" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Vous et votre voiture, en sécurité à destination. Service de raccompagnement
              à {LAUNCH_ZONE.name}.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Veloop. Tous droits réservés.</p>
          <p className="max-w-2xl">
            Veloop est un projet en phase de validation (MVP). Les assurances, responsabilités,
            conditions d&apos;exercice et règles réglementaires doivent être validées avant tout
            lancement commercial.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { Info } from "lucide-react";
import { PageHero } from "./page-hero";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow="Informations légales" title={title} subtitle={`Dernière mise à jour : ${updatedAt}`} />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-border bg-subtle p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Document type fourni dans le cadre du MVP. Il doit être revu et validé par un conseil
            juridique avant tout lancement commercial.
          </p>
        </div>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-lg font-bold text-foreground">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">{p}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

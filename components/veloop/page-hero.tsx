export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-border bg-gradient-to-b from-primary-soft/50 to-background">
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 md:py-20">
        {eyebrow && (
          <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

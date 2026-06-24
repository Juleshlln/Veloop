"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, User, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { signUpAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis."),
  lastName: z.string().min(1, "Nom requis."),
  email: z.string().email("Adresse e-mail invalide."),
  phone: z.string().optional(),
  password: z.string().min(6, "6 caractères minimum."),
});

type FormValues = z.infer<typeof schema>;

export function SignUpForm() {
  const [role, setRole] = React.useState<"customer" | "driver">("customer");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpAction({ ...values, role });
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Créer un compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">Rejoignez Veloop en quelques secondes.</p>

      {/* role selector */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { value: "customer" as const, label: "Je suis client", icon: User, hint: "Commander un chauffeur" },
          { value: "driver" as const, label: "Je suis chauffeur", icon: Bike, hint: "Conduire avec Veloop" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRole(opt.value)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
              role === opt.value ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-border bg-card",
            )}
          >
            <opt.icon className={cn("size-5", role === opt.value ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-bold text-foreground">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.hint}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-xl bg-[#fdeaed] p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" autoComplete="given-name" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" autoComplete="family-name" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="+33 6 12 34 56 78" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="6 caractères minimum" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner className="text-current" /> : "Créer mon compte"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          En continuant, vous acceptez les{" "}
          <Link href="/conditions" className="underline">conditions</Link> et la{" "}
          <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-primary hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}

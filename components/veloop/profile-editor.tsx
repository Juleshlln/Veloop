"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { SignOutButton } from "./sign-out-button";
import { toast } from "@/components/ui/toaster";
import { updateProfileAction } from "@/lib/actions/account";
import type { Profile } from "@/lib/types";

const ROLE_LABEL: Record<Profile["role"], string> = {
  customer: "Client",
  driver: "Chauffeur",
  admin: "Administrateur",
};

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState(profile.first_name);
  const [lastName, setLastName] = React.useState(profile.last_name);
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [pending, startTransition] = React.useTransition();

  function save() {
    startTransition(async () => {
      const res = await updateProfileAction({ firstName, lastName, phone });
      if (res.error) toast({ title: res.error, tone: "error" });
      else {
        toast({ title: "Profil mis à jour", tone: "success" });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Mon profil</h1>

      <Card className="flex items-center gap-4 p-5">
        <Avatar firstName={profile.first_name} lastName={profile.last_name} src={profile.avatar_url} className="size-16 text-lg" />
        <div>
          <p className="text-lg font-bold text-foreground">{profile.first_name} {profile.last_name}</p>
          <Badge variant="neutral" className="mt-1">{ROLE_LABEL[profile.role]}</Badge>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fn">Prénom</Label>
            <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ln">Nom</Label>
            <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ph">Téléphone</Label>
          <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em">Adresse e-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="em" value={profile.email} readOnly disabled className="pl-10" />
          </div>
        </div>
        <Button onClick={save} disabled={pending} size="lg" className="w-full">
          {pending ? <Spinner className="text-current" /> : "Enregistrer"}
        </Button>
      </Card>

      <SignOutButton />
    </div>
  );
}

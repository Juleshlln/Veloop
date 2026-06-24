import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/auth/session";
import { SignUpForm } from "@/components/veloop/auth/sign-up-form";
import { DemoAccounts } from "@/components/veloop/auth/demo-accounts";

export const metadata = { title: "Inscription" };

export default async function InscriptionPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <>
      <SignUpForm />
      <DemoAccounts />
    </>
  );
}

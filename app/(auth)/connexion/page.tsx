import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/auth/session";
import { SignInForm } from "@/components/veloop/auth/sign-in-form";
import { DemoAccounts } from "@/components/veloop/auth/demo-accounts";

export const metadata = { title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  const { next } = await searchParams;

  return (
    <>
      <SignInForm next={next} />
      <DemoAccounts />
    </>
  );
}

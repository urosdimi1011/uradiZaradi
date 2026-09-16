import type { Metadata } from "next";

import { AuthFootLink, AuthShell } from "../_auth/auth-shell";
import { SignInForm } from "../_auth/sign-in-form";
import { makeT } from "@/lib/dictionary";
import { getScript } from "@/lib/script.server";

export const metadata: Metadata = {
  title: "Prijava",
  description: "Prijavite se na svoj Uradi zaradi nalog.",
  /* Prijava nema šta da radi u pretrazi — nema sadržaja, a troši crawl budžet. */
  robots: { index: false, follow: false },
};

export default async function SignInPage({ searchParams }: PageProps<"/prijava">) {
  const script = await getScript();
  const { next } = await searchParams;
  const t = makeT(script);

  return (
    <AuthShell
      script={script}
      title={t("signInTitle")}
      googleLabel={t("signInGoogle")}
      foot={
        <>
          {t("noAccount")} <AuthFootLink href="/registracija">{t("signUp")}</AuthFootLink>
        </>
      }
    >
      <SignInForm script={script} next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}

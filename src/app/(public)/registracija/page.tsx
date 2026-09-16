import type { Metadata } from "next";

import { AuthFootLink, AuthShell } from "../_auth/auth-shell";
import { SignUpForm } from "../_auth/sign-up-form";
import { makeT } from "@/lib/dictionary";
import { getScript } from "@/lib/script.server";

export const metadata: Metadata = {
  title: "Registracija",
  description: "Napravite nalog na Uradi zaradi — kao naručilac posla ili kao majstor.",
  robots: { index: false, follow: false },
};

export default async function SignUpPage() {
  const script = await getScript();
  const t = makeT(script);

  return (
    <AuthShell
      script={script}
      title={t("signUpTitle")}
      googleLabel={t("signUpGoogle")}
      foot={
        <>
          {t("haveAccount")} <AuthFootLink href="/prijava">{t("signIn")}</AuthFootLink>
        </>
      }
    >
      <SignUpForm script={script} />
    </AuthShell>
  );
}

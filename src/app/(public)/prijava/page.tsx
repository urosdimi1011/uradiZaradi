import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Headphones, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ToolsIllustration } from "@/components/brand/tools-illustration";
import { ToolsWallpaper } from "@/components/brand/tools-wallpaper";
import { makeT } from "@/lib/dictionary";
import { getScript, type Script } from "@/lib/script";
import { FacebookMark, GoogleMark } from "./social-marks";
import { PasswordField, TextField } from "./fields";
import styles from "./prijava.module.css";

export const metadata: Metadata = {
  title: "Prijava",
  description: "Prijavite se na svoj Uradi zaradi nalog.",
  robots: { index: false, follow: false },
};

export default async function SignInPage() {
  const script = await getScript();
  const t = makeT(script);

  return (
    <div className={styles.pageWrap}>
      <ToolsWallpaper className={styles.wallpaper} />

      <div className={styles.page}>
        <div className={styles.grid}>
          <div className={styles.formColumn}>
            <div className={styles.logo}>
              <Logo script={script} size="lg" />
            </div>

            <div className={styles.card}>
              <h1 className={styles.title}>{t("signInTitle")}</h1>

              {/*
              Forma je bez `onSubmit` handlera — u Fazi 1 dobija Server Action sa
              Auth.js-om. Do tada je ispravna HTML forma koja radi i bez JavaScripta.
            */}
              <form>
                <div className={styles.fields}>
                  <TextField
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder={t("emailOrUsername")}
                    aria-label={t("emailOrUsername")}
                  />
                  <PasswordField
                    name="password"
                    autoComplete="current-password"
                    placeholder={t("password")}
                    aria-label={t("password")}
                  />
                </div>

                <div className={styles.forgotRow}>
                  <Link href="/zaboravljena-lozinka" className={styles.forgot}>
                    {t("forgotPassword")}
                  </Link>
                </div>

                <button type="submit" className={styles.submit}>
                  {t("signIn")}
                </button>
              </form>

              <div className={styles.divider}>
                <span className={styles.dividerLabel}>{t("or")}</span>
              </div>

              <div className={styles.socials}>
                <button type="button" className={styles.social}>
                  <GoogleMark />
                  {t("signInGoogle")}
                </button>
                <button type="button" className={styles.social}>
                  <FacebookMark />
                  {t("signInFacebook")}
                </button>
              </div>

              <p className={styles.footNote}>
                {t("noAccount")}{" "}
                <Link href="/registracija-majstora" className={styles.footLink}>
                  {t("signUp")}
                </Link>
              </p>
            </div>
          </div>

          <TrustPanel script={script} />
        </div>
      </div>
    </div>
  );
}

function TrustPanel({ script }: { script: Script }) {
  const t = makeT(script);

  const benefits: { icon: LucideIcon; title: string; text: string }[] = [
    {
      icon: ShieldCheck,
      title: t("trustVerifiedTitle"),
      text:
        script === "cyrl"
          ? "Сви мајстори су проверени и оцењени од стране корисника."
          : "Svi majstori su provereni i ocenjeni od strane korisnika.",
    },
    {
      icon: CreditCard,
      title: t("trustPayTitle"),
      text:
        script === "cyrl"
          ? "Плаћајте безбедно преко наше платформе. Ваше информације су заштићене."
          : "Plaćajte bezbedno preko naše platforme. Vaše informacije su zaštićene.",
    },
    {
      icon: Headphones,
      title: t("trustSupportTitle"),
      text:
        script === "cyrl"
          ? "Наш тим је ту за вас увек када вам је потребна помоћ."
          : "Naš tim je tu za vas uvek kada vam je potrebna pomoć.",
    },
  ];

  return (
    <aside className={styles.panel}>
      <div className={styles.panelMedia}>
        <ToolsIllustration className={styles.panelArt} />
      </div>

      <ul className={styles.benefits}>
        {benefits.map(({ icon: Icon, title, text }) => (
          <li key={title} className={styles.benefit}>
            <span className={styles.benefitIcon}>
              <Icon width={22} height={22} aria-hidden />
            </span>
            <div>
              <p className={styles.benefitTitle}>{title}</p>
              <p className={styles.benefitText}>{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

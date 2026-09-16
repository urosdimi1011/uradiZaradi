import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, Headphones, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ToolsIllustration } from "@/components/brand/tools-illustration";
import { ToolsWallpaper } from "@/components/brand/tools-wallpaper";
import { isGoogleEnabled } from "@/lib/auth";
import { signInWithGoogleAction } from "@/modules/users/actions";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import { GoogleMark } from "./social-marks";
import styles from "./auth.module.css";

/**
 * Zajednički okvir za prijavu i registraciju.
 *
 * Obe stranice su ista stvar sa drugom formom: tapeta, logo, kartica levo,
 * panel poverenja desno. Kad se stil menja — a menjaće se — menja se na jednom
 * mestu umesto u dva fajla koja neminovno odlutaju jedan od drugog.
 *
 * Server komponenta: forma koja se ubacuje kroz `children` je klijentska, ali
 * sve oko nje je statično i ne treba da putuje u pretraživač.
 */
export function AuthShell({
  script,
  title,
  children,
  googleLabel,
  foot,
}: {
  script: Script;
  title: string;
  children: ReactNode;
  /** Tekst na Google dugmetu; izostavljen znači da se dugme uopšte ne prikazuje. */
  googleLabel?: string;
  foot: ReactNode;
}) {
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
              <h1 className={styles.title}>{title}</h1>

              {children}

              {/*
                Facebook je skinut: traži poslovnu verifikaciju i pregled od Mete,
                a prijava preko njega je svuda u padu. Google pokriva istu potrebu.

                Google se prikazuje SAMO ako su ključevi podešeni — inače bi dugme
                vodilo u grešku na svežoj instalaciji.
              */}
              {googleLabel && isGoogleEnabled ? (
                <>
                  <div className={styles.divider}>
                    <span className={styles.dividerLabel}>{makeT(script)("or")}</span>
                  </div>
                  <form action={signInWithGoogleAction} className={styles.socials}>
                    <button type="submit" className={styles.social}>
                      <GoogleMark />
                      {googleLabel}
                    </button>
                  </form>
                </>
              ) : null}

              <p className={styles.footNote}>{foot}</p>
            </div>
          </div>

          <TrustPanel script={script} />
        </div>
      </div>
    </div>
  );
}

/** Link u podnožju kartice — da stranice ne ponavljaju ime klase. */
export function AuthFootLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.footLink}>
      {children}
    </Link>
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

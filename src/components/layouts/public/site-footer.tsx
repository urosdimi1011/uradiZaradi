import { CreditCard, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { makeT, type UiKey } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import styles from "./site-footer.module.css";

const TRUST: { icon: LucideIcon; title: UiKey; text: UiKey }[] = [
  { icon: ShieldCheck, title: "trustVerifiedTitle", text: "trustVerifiedText" },
  { icon: CreditCard, title: "trustPayTitle", text: "trustPayText" },
  { icon: Sparkles, title: "trustFastTitle", text: "trustFastText" },
  { icon: Headphones, title: "trustSupportTitle", text: "trustSupportText" },
];

export function SiteFooter({ script }: { script: Script }) {
  const t = makeT(script);

  return (
    <footer className="mt-auto border-t border-line bg-surface-raised">
      <div className={styles.grid}>
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className={styles.item}>
            <Icon width={26} height={26} aria-hidden className={styles.icon} />
            <div className={styles.text}>
              <p className="text-sm font-semibold text-content-primary">{t(title)}</p>
              <p className="mt-0.5 text-sm leading-snug text-content-secondary">{t(text)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="page-container py-5 text-xs text-content-muted">
          © {new Date().getFullYear()} Uradi zaradi. {t("demoBanner")}
        </div>
      </div>
    </footer>
  );
}

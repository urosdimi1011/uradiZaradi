"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Hammer, Heart, Home, LayoutGrid, Menu, X } from "lucide-react";

import { ScriptToggle } from "./script-toggle";
import { CategoryIcon } from "@/modules/catalog/ui/category-icon";
import type { Category } from "@/modules/catalog/domain";
import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import { t as pick, type Script } from "@/lib/script";
import styles from "./mobile-menu.module.css";

/**
 * Mobilni meni u fioci sa desne strane.
 *
 * Native `<dialog>` + `showModal()` — dobija zaključan fokus, zatvaranje na Esc,
 * `inert` za ostatak stranice i backdrop, bez pisanja ijedne od tih stvari ručno.
 *
 * Zatvaranje se odlaže do kraja animacije: `close()` sakriva element odmah, pa bi
 * fioka bez toga nestala naglo iako je ušla klizanjem.
 */
export function MobileMenu({
  categories,
  script,
}: {
  categories: Category[];
  script: Script;
}) {
  const t = makeT(script);
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => setClosing(true), []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !closing) return;

    const done = () => {
      dialog.close();
      setClosing(false);
    };

    dialog.addEventListener("animationend", done, { once: true });
    /* Osigurač: ako animacija ne okine (reduced-motion, prekinut render), fioka
       se ipak zatvara umesto da ostane zaglavljena preko ekrana. */
    const fallback = setTimeout(done, 400);

    return () => {
      clearTimeout(fallback);
      dialog.removeEventListener("animationend", done);
    };
  }, [closing]);

  /* Navigacija je klijentska, pa se fioka ne bi sama zatvorila posle klika. */
  useEffect(() => {
    if (ref.current?.open) {
      ref.current.close();
      setClosing(false);
    }
  }, [pathname]);

  const links = [
    { href: "/", icon: Home, label: t("navHome") },
    { href: "/kategorije", icon: LayoutGrid, label: t("allCategories") },
    { href: "/sacuvano", icon: Heart, label: t("navSaved") },
    { href: "/registracija-majstora", icon: Hammer, label: t("becomeMajstor") },
  ];

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t("menu")}
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <Menu width={20} height={20} aria-hidden />
      </button>

      <dialog
        ref={ref}
        aria-label={t("menu")}
        className={cn(styles.drawer, closing && styles.closing)}
        /* Klik na zatamnjenu pozadinu zatvara — očekivano ponašanje fioke. */
        onClick={(event) => {
          if (event.target === ref.current) close();
        }}
        onCancel={(event) => {
          // Esc: presrećemo da bismo odigrali izlaznu animaciju.
          event.preventDefault();
          close();
        }}
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>{t("menu")}</span>
            <button
              type="button"
              onClick={close}
              className={styles.close}
              aria-label={t("close")}
            >
              <X width={20} height={20} aria-hidden />
            </button>
          </div>

          <div className={styles.scroll}>
            <div className={styles.auth}>
              <Link
                href="/prijava"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-line-strong text-sm font-medium text-content-primary"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/registracija-majstora"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] bg-brand text-sm font-semibold text-brand-foreground"
              >
                {t("signUp")}
              </Link>
            </div>

            <nav className={styles.section} aria-label={t("navigation")}>
              <p className={styles.sectionLabel}>{t("navigation")}</p>
              <div className={styles.links}>
                {links.map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href} className={styles.link}>
                    <Icon width={18} height={18} aria-hidden className={styles.linkIcon} />
                    {label}
                  </Link>
                ))}
              </div>
            </nav>

            <nav className={styles.section} aria-label={t("allCategories")}>
              <p className={styles.sectionLabel}>{t("allCategories")}</p>
              <div className={styles.links}>
                {categories.map((category) => {
                  const active = pathname === `/${category.slug}`;
                  return (
                    <Link
                      key={category.id}
                      href={`/${category.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        styles.link,
                        styles.categoryLink,
                        active && styles.categoryActive,
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <CategoryIcon
                          name={category.icon}
                          size={18}
                          className={active ? undefined : styles.linkIcon}
                        />
                        {pick(category.name, script)}
                      </span>
                      <ChevronRight width={16} height={16} aria-hidden className={styles.linkIcon} />
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          <div className={styles.footer}>
            <span className={styles.footerLabel}>{t("script")}</span>
            <ScriptToggle script={script} />
          </div>
        </div>
      </dialog>
    </>
  );
}

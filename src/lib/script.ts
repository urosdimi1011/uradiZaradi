import type { LocalizedText } from "@/modules/shared/domain/primitives";

/**
 * Pismo (script), ne jezik. Sadržaj je isti srpski tekst u dve azbuke,
 * pa ovo NIJE i18n u klasičnom smislu — nema prevoda, ima transliteracije.
 *
 * Latinica je default jer se u Srbiji pretraga na Google-u obavlja latinicom;
 * ćirilica bi nas koštala većine organskog saobraćaja.
 */
export const SCRIPTS = ["latn", "cyrl"] as const;
export type Script = (typeof SCRIPTS)[number];

export const DEFAULT_SCRIPT: Script = "latn";
export const SCRIPT_COOKIE = "pismo";

/*
 * Ovaj modul mora da ostane bez `next/headers` — uvoze ga i klijentske
 * komponente (mobilni meni, filter). Čitanje cookie-ja živi u `script.server.ts`.
 */

/** Vrednost za <html lang> — hreflang parovi se generišu iz istog izvora. */
export const SCRIPT_LANG: Record<Script, string> = {
  latn: "sr-Latn-RS",
  cyrl: "sr-Cyrl-RS",
};

/** Uzima pravu varijantu iz LocalizedText polja. */
export function t(text: LocalizedText, script: Script): string {
  return script === "cyrl" ? text.cyrl : text.latn;
}

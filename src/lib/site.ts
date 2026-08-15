export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://uradizaradi.rs";

export const SITE_NAME = "Uradi zaradi";

/**
 * Faza 0 je demo sa izmišljenim majstorima. Dok je ovo `true`, ceo sajt je
 * zatvoren za indeksiranje — indeksirani lažni profili bi naneli trajnu štetu
 * domenu koji tek treba da gradi autoritet.
 *
 * Skida se postavljanjem NEXT_PUBLIC_SITE_IS_DEMO=false, tek kad uđu pravi profili.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_SITE_IS_DEMO !== "false";

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

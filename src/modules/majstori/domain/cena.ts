/**
 * Cene u dinarima.
 *
 * U bazi se čuva `minPriceMinor` — iznos u PARAMA, kao ceo broj. Razlog je
 * standardan: `1872.30` u pokretnom zarezu nije tačno 1872.30, pa se sabiranjem
 * i poređenjem cena vremenom nakupi greška. Ceo broj para nema tu manu.
 *
 * Unos je druga priča. Čovek koji kuca cenu ne razmišlja o parama, i ne kuca je
 * na jedan način:
 *
 *   „1500"      „1.500"      „1 500"      „1500,00"      „1.500,50"
 *
 * Sve to je isti iznos. Srpski zapis koristi TAČKU za hiljade i ZAREZ za
 * decimale — obrnuto od engleskog. Zato se ne može prosto pozvati
 * `parseFloat`: on bi „1.500" pročitao kao jedan i po dinara.
 */

/** Najviša cena koja se prihvata: 10 miliona dinara po jedinici. */
export const NAJVECA_CENA_RSD = 10_000_000;

/**
 * Tekst iz polja → pare, ili `null` za prazno („po dogovoru").
 *
 * Vraća `undefined` kad unos uopšte nije broj — pozivalac to razlikuje od
 * praznog polja i javlja grešku.
 */
export function parsirajCenu(unos: string): number | null | undefined {
  const ocisceno = unos.trim();
  if (!ocisceno) return null;

  /* Razmaci i razmaci-bez-preloma (koje kopiranje iz Excela ume da ubaci). */
  let tekst = ocisceno.replace(/[\s ]/g, "");

  const imaZarez = tekst.includes(",");
  const imaTacku = tekst.includes(".");

  if (imaZarez && imaTacku) {
    /* Oba znaka: tačka je hiljade, zarez decimale — „1.500,50". */
    tekst = tekst.replace(/\./g, "").replace(",", ".");
  } else if (imaZarez) {
    /* Samo zarez: decimalni — „1500,50". */
    tekst = tekst.replace(",", ".");
  } else if (imaTacku) {
    /*
     * Samo tačka je dvosmislena. „1.500" je hiljadu petsto, „1.5" je jedan i po.
     * Pravilo: tačno tri cifre posle tačke znače hiljade, sve ostalo decimale.
     * Nije savršeno, ali „1.500" kao dinar i po niko nikad nije mislio.
     */
    tekst = /\.\d{3}$/.test(tekst) ? tekst.replace(/\./g, "") : tekst;
  }

  if (!/^\d+(\.\d+)?$/.test(tekst)) return undefined;

  const dinara = Number(tekst);
  if (!Number.isFinite(dinara) || dinara <= 0) return undefined;
  if (dinara > NAJVECA_CENA_RSD) return undefined;

  /* Zaokruživanje je obavezno: 18.72 * 100 u pokretnom zarezu daje 1871.9999… */
  return Math.round(dinara * 100);
}

/** Pare → tekst za polje: `187200` → `1872`. Decimale se prikazuju samo kad postoje. */
export function cenaZaUnos(minor: number | null | undefined): string {
  if (minor == null) return "";
  const dinara = minor / 100;
  return Number.isInteger(dinara) ? String(dinara) : dinara.toFixed(2).replace(".", ",");
}

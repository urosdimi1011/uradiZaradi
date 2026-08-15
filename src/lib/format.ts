import { PRICE_UNIT_LABEL, type PriceUnit } from "@/modules/catalog/domain";
import type { Script } from "@/lib/script";

/**
 * Informativni kurs. U produkciji dolazi sa dnevne kursne liste NBS-a i kešira se —
 * ovde je konstanta jer je Faza 0 statična.
 */
export const EUR_RATE = 117;

const rsdFormatter = new Intl.NumberFormat("sr-RS", { maximumFractionDigits: 0 });

/**
 * Cene se čuvaju u dinarima jer je oglašavanje u evrima pravno klimavo u Srbiji.
 * Prikaz u € ostaje kao informativan dodatak, jer su mockup i tržišna navika u evrima.
 */
export function formatPriceFrom(
  amountMinor: number | null,
  unit: PriceUnit,
  script: Script,
): string {
  const unitLabel = script === "cyrl" ? PRICE_UNIT_LABEL[unit].cyrl : PRICE_UNIT_LABEL[unit].latn;
  if (amountMinor === null || unit === "PO_DOGOVORU") {
    return script === "cyrl" ? "По договору" : "Po dogovoru";
  }
  const dinars = Math.round(amountMinor / 100);
  const prefix = script === "cyrl" ? "Од" : "Od";
  return `${prefix} ${rsdFormatter.format(dinars)} RSD / ${unitLabel}`;
}

/**
 * Kompaktan prikaz za kartice. Valuta se NE izostavlja radi kratkoće —
 * gola brojka „Od 1.872 / m²" ne znači ništa kad na tržištu kolaju i dinari i evri.
 */
export function formatPriceCompact(
  amountMinor: number | null,
  unit: PriceUnit,
  script: Script,
): string {
  const unitLabel = script === "cyrl" ? PRICE_UNIT_LABEL[unit].cyrl : PRICE_UNIT_LABEL[unit].latn;
  if (amountMinor === null || unit === "PO_DOGOVORU") {
    return script === "cyrl" ? "По договору" : "Po dogovoru";
  }
  const prefix = script === "cyrl" ? "Од" : "Od";
  return `${prefix} ${rsdFormatter.format(Math.round(amountMinor / 100))} RSD / ${unitLabel}`;
}

export function approxEur(amountMinor: number | null): string | null {
  if (amountMinor === null) return null;
  return `≈ ${Math.round(amountMinor / 100 / EUR_RATE)} €`;
}

export function formatCount(value: number): string {
  return rsdFormatter.format(value);
}

/**
 * Srpski mobilni broj u čitljiv oblik: +381611234567 → "+381 61 123 4567".
 *
 * Za `tel:` link se i dalje koristi sirov broj — razmaci u `href`-u zbunjuju
 * neke Android dialere.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("381")) return phone;

  const national = digits.slice(3);
  const operator = national.slice(0, 2);
  const rest = national.slice(2);
  if (!rest) return `+381 ${operator}`;

  // Poslednje četiri cifre se odvajaju, ostatak ide u sredinu.
  const tail = rest.slice(-4);
  const head = rest.slice(0, -4);
  return head ? `+381 ${operator} ${head} ${tail}` : `+381 ${operator} ${tail}`;
}

/** "Pre 2 dana" — relativno vreme sa mockupa. */
export function formatRelative(date: Date, script: Script, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
  const prefix = script === "cyrl" ? "Пре" : "Pre";
  if (days === 0) return script === "cyrl" ? "Данас" : "Danas";
  if (days === 1) return script === "cyrl" ? "Јуче" : "Juče";
  if (days < 31) return `${prefix} ${days} ${script === "cyrl" ? "дана" : "dana"}`;
  const months = Math.floor(days / 30);
  if (months < 12) {
    const word = months === 1 ? (script === "cyrl" ? "месец" : "mesec") : script === "cyrl" ? "месеци" : "meseci";
    return `${prefix} ${months} ${word}`;
  }
  const years = Math.floor(months / 12);
  const word = years === 1 ? (script === "cyrl" ? "годину" : "godinu") : script === "cyrl" ? "године" : "godine";
  return `${prefix} ${years} ${word}`;
}

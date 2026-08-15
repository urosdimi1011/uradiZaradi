"use server";

import { majstorRepository } from "@/modules/majstori/repository";
import { parseFilters, toMajstorQuery, type ListingSearchParams } from "./filters";

/**
 * Broji rezultate za trenutno stanje forme, bez slanja.
 *
 * Poenta je da korisnik ne mora da primeni filter da bi saznao da nema nikoga —
 * pa da se vraća i vraća u panel. Brojka na dugmetu se menja dok se štiklira.
 *
 * Broji server, ne klijent: filtriranje bi inače značilo da ceo katalog majstora
 * mora da se pošalje u pretraživač, što ne može da preživi ni prvih hiljadu profila.
 */
export async function countMajstoriAction(
  entries: [string, string][],
  categorySlug: string | null,
): Promise<number> {
  // FormData daje ponovljene ključeve za checkboxove — sklapaju se nazad u nizove.
  const params: ListingSearchParams = {};
  for (const [key, value] of entries) {
    const current = params[key];
    if (current === undefined) params[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else params[key] = [current, value];
  }

  const query = await toMajstorQuery(parseFilters(params), categorySlug, 1, 1);
  const { total } = await majstorRepository.search(query);
  return total;
}

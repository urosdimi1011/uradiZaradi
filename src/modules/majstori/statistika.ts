"use server";

import { getCurrentUser } from "@/lib/session";
import { majstorRepository } from "./repository";

/**
 * Brojanje pregleda profila i otkrivanja telefona.
 *
 * ── Zašto se broji iz pretraživača, a ne pri renderu ──
 *
 * Roboti. Googlebot, skreperi i alati za praćenje dostupnosti traže stranicu
 * kao i svako drugi, pa bi brojanje na serveru većinom merilo njih. Server
 * Action se izvršava tek kad se komponenta montira — a to zahteva pravi
 * pretraživač koji izvršava JavaScript.
 *
 * Drugi razlog je tehnički: server komponenta NE SME da postavi kolačić (Next
 * to dozvoljava samo akcijama, route handlerima i middleware-u). Bez kolačića
 * ili sličnog traga nema odbrane od osvežavanja, pa bi jedan čovek sa F5
 * naduvao brojku za dan.
 *
 * Provereno je usput da preučitavanje linkova NIJE problem: profil je dinamička
 * ruta, pa Next unapred povlači samo do najbližeg `loading.tsx`, kog nema.
 */

/**
 * Jedan pregled profila.
 *
 * Odbacivanje duplikata radi pretraživač (`sessionStorage`), jer je to jedino
 * mesto gde se zna da je isti čovek već bio ovde u ovoj seansi. Ovde se hvata
 * ono što on ne može: da je posetilac zapravo vlasnik profila.
 */
export async function zabeleziPregledAction(majstorId: string): Promise<void> {
  if (!majstorId) return;

  const user = await getCurrentUser();

  /*
   * Majstor koji gleda sopstveni profil se ne broji. Gleda ga svakodnevno —
   * bez ovoga bi mu brojka rasla sama i ne bi značila ništa.
   */
  if (user && (await majstorRepository.jeVlasnik(majstorId, user.id))) return;

  await majstorRepository.uvecajPregled(majstorId);
}

/**
 * Klik na „Prikaži broj".
 *
 * Vredniji podatak od pregleda: ko uzme broj, obično i zove. Majstoru je to
 * merilo koliko mu profil zaista donosi, a ne koliko ga ljudi prelista.
 */
export async function zabeleziOtkrivanjeBrojaAction(majstorId: string): Promise<void> {
  if (!majstorId) return;

  const user = await getCurrentUser();
  if (user && (await majstorRepository.jeVlasnik(majstorId, user.id))) return;

  await majstorRepository.uvecajOtkrivanjeBroja(majstorId);
}

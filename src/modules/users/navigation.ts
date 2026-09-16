import "server-only";

import { cache } from "react";

import { majstorRepository } from "@/modules/majstori/repository";
import type { CurrentUser } from "@/lib/session";
import { putanjaZaStanje, stanjeOdStatusa, type StanjeProfila } from "./routing";

/**
 * Dohvatanje stanja majstorskog profila.
 *
 * Sve odluke su u `routing.ts` i testiraju se bez baze; ovde je samo upit i
 * keširanje. Podela je nastala iz testa: dok je bilo zajedno, provera odluke
 * nije mogla da se pokrene bez pokrenutog Postgresa.
 */

export type { StanjeProfila };

/**
 * Stanje profila prijavljenog majstora, ili `null` ako korisnik nije majstor.
 *
 * `cache()` jer isti podatak traže i traka i zaglavlje i stranica u istom
 * renderu — bez toga bi to bila tri upita po prikazu stranice. Keš traje koliko
 * i jedan zahtev, pa se stanje ne preliva između korisnika.
 */
export const getStanjeProfila = cache(
  async (user: CurrentUser | null): Promise<StanjeProfila | null> => {
    if (user?.role !== "MAJSTOR") return null;
    return stanjeOdStatusa(await majstorRepository.findProfileStateByUserId(user.id));
  },
);

export async function putanjaPoslePrijave(user: CurrentUser): Promise<string> {
  return putanjaZaStanje(user.role, await getStanjeProfila(user));
}

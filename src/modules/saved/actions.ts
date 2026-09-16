"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/session";
import { savedRepository } from "./repository";

/**
 * Čuvanje majstora.
 *
 * POST kroz Server Action, jer menja podatke — isto pravilo kao svuda: GET samo
 * za čitanje i pretragu.
 */

export type SacuvajIshod =
  | { ok: true; sacuvan: boolean }
  /** Gost — pozivalac ga šalje na prijavu i vraća nazad odakle je krenuo. */
  | { ok: false; razlog: "prijava" };

export async function prebaciSacuvanoAction(majstorId: string): Promise<SacuvajIshod> {
  const user = await getCurrentUser();

  /*
   * Gost se ne odbija greškom nego se traži prijava. Lista sačuvanih vezana za
   * nalog preživi promenu uređaja — a čovek koji je sačuvao deset majstora na
   * telefonu očekuje da ih nađe i na računaru.
   *
   * Kad se uključi čuvanje preko `deviceId`, ova grana nestaje: gost čuva
   * odmah, a lista mu se prenese na nalog pri prvoj prijavi.
   */
  if (!user) return { ok: false, razlog: "prijava" };

  if (!majstorId) return { ok: true, sacuvan: false };

  const sacuvan = await savedRepository.toggle(user.id, majstorId);

  /*
   * Brojač u zaglavlju stoji na svakoj stranici, pa se osvežava ceo layout.
   * Bez ovoga bi srce pocrvenelo, a broj pored njega ostao isti.
   */
  revalidatePath("/", "layout");

  return { ok: true, sacuvan };
}

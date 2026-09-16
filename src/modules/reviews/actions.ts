"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { majstorRepository } from "@/modules/majstori/repository";
import { getCurrentUser } from "@/lib/session";
import { reviewRepository } from "./repository";
import {
  PORUKE_ZABRANE,
  pocetniStatus,
  recenzijaSchema,
  smeDaOceni,
} from "./domain/pravila";

/**
 * Ostavljanje recenzije.
 *
 * Pravila su u `domain/pravila.ts` i testirana bez baze; ovde se samo pročita
 * ono što im treba i primeni odluka.
 */

export type RecenzijaStanje = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Uspeh — poruka zavisi od toga da li recenzija čeka moderaciju. */
  uspeh?: "objavljena" | "na-cekanju";
  values?: { rating?: string; body?: string; serviceTypeId?: string };
};

export async function ostaviRecenzijuAction(
  _prev: RecenzijaStanje,
  formData: FormData,
): Promise<RecenzijaStanje> {
  const slug = String(formData.get("slug") ?? "");

  const values = {
    rating: String(formData.get("rating") ?? ""),
    body: String(formData.get("body") ?? ""),
    serviceTypeId: String(formData.get("serviceTypeId") ?? ""),
  };

  const majstor = await majstorRepository.findBySlug(slug);
  if (!majstor) return { error: "Majstor nije pronađen.", values };

  const korisnik = await getCurrentUser();

  /*
   * Provera prava ide PRE provere sadržaja: nema smisla javljati da je tekst
   * prekratak čoveku koji ionako ne sme da ostavi recenziju.
   */
  const pravo = smeDaOceni({
    korisnikId: korisnik?.id ?? null,
    majstorUserId: majstor.userId,
    majstorStatus: majstor.status,
    vecOcenio: korisnik ? await reviewRepository.vecOcenio(majstor.id, korisnik.id) : false,
  });

  if (!pravo.sme) return { error: PORUKE_ZABRANE[pravo.razlog], values };

  const parsed = recenzijaSchema.safeParse({
    rating: Number(values.rating),
    body: values.body,
    serviceTypeId: values.serviceTypeId,
  });

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error) as {
      fieldErrors: Record<string, string[] | undefined>;
    };
    const greske: Record<string, string> = {};
    for (const [polje, poruke] of Object.entries(fieldErrors)) {
      if (poruke?.[0]) greske[polje] = poruke[0];
    }
    return { fieldErrors: greske, values };
  }

  const { rating, body, serviceTypeId } = parsed.data;
  const status = pocetniStatus(rating);

  /*
   * Ime autora se PREPISUJE u recenziju umesto da se čita iz naloga pri svakom
   * prikazu. Dva razloga: profil ostaje čitljiv i kad korisnik obriše nalog, a
   * kasnija promena imena ne prepisuje ono pod čim je recenzija napisana.
   */
  await reviewRepository.dodaj({
    majstorId: majstor.id,
    authorUserId: korisnik!.id,
    authorDisplayName: skratiIme(korisnik!.displayName),
    authorAvatarUrl: korisnik!.avatarUrl,
    rating,
    body,
    serviceTypeId,
    status,
  });

  revalidatePath(`/majstor/${slug}`);
  revalidatePath(`/majstor/${slug}/recenzije`);

  return { uspeh: status === "PUBLISHED" ? "objavljena" : "na-cekanju" };
}

/**
 * „Milan Lukić" → „Milan L."
 *
 * Puno prezime se ne objavljuje. Recenzija je javna i indeksirana, a čovek koji
 * je ostavio ocenu nije pristao da mu ime stoji uz nju na Google-u.
 */
function skratiIme(ime: string): string {
  const delovi = ime.trim().split(/\s+/);
  if (delovi.length < 2) return delovi[0] ?? "Korisnik";
  return `${delovi[0]} ${delovi[delovi.length - 1]![0]!.toUpperCase()}.`;
}

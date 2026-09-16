"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { reviewRepository } from "@/modules/reviews/repository";
import { adminRepository } from "./repository";
import { beleskaSchema, kategorijaSchema, uslugaSchema } from "./domain/forme";
import {
  PORUKE_ZABRANE_BRISANJA,
  PORUKE_ZABRANE_NAD_KORISNIKOM,
  posledicaStatusa,
  smeDaObriseKategoriju,
  smeDaObriseUslugu,
  smeNadKorisnikom,
  type UserStatus,
} from "./domain/pravila";

/**
 * Akcije administracije.
 *
 * Provera uloge je u SVAKOJ akciji, ne samo u layout-u. Layout štiti ekran;
 * akcija je HTTP krajnja tačka koju svako može da pozove ako zna njeno ime.
 */
export type Stanje = { ok: true; poruka?: string } | { ok: false; greska: string };

const OPSTA_GRESKA = "Došlo je do greške. Pokušajte ponovo.";

async function zahtevajAdmina(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  /* Ista odluka kao u layout-u: ne potvrđuje se ni da administracija postoji. */
  if (user?.role !== "ADMIN") redirect("/");
  return { id: user.id };
}

/** Prva greška iz Zod-a, na srpskom, jer forme ovde imaju jedno polje po redu. */
function prvaGreska(greska: z.ZodError): string {
  return greska.issues[0]?.message ?? OPSTA_GRESKA;
}

/* ─────────────────── Kategorije ─────────────────── */

export async function sacuvajKategorijuAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  await zahtevajAdmina();

  const id = String(podaci.get("id") ?? "");
  const razdvojeno = kategorijaSchema.safeParse({
    slug: podaci.get("slug"),
    nameLatn: podaci.get("nameLatn"),
    nameCyrl: podaci.get("nameCyrl"),
    nameSingularLatn: podaci.get("nameSingularLatn"),
    nameSingularCyrl: podaci.get("nameSingularCyrl"),
    icon: podaci.get("icon"),
    introLatn: podaci.get("introLatn"),
    introCyrl: podaci.get("introCyrl"),
    seoTitle: podaci.get("seoTitle") ?? "",
    seoDescription: podaci.get("seoDescription") ?? "",
    sortOrder: podaci.get("sortOrder") ?? "0",
    isActive: podaci.get("isActive") === "1",
  });

  if (!razdvojeno.success) return { ok: false, greska: prvaGreska(razdvojeno.error) };

  try {
    if (id) {
      await adminRepository.izmeniKategoriju(id, razdvojeno.data);
    } else {
      await adminRepository.napraviKategoriju(razdvojeno.data);
    }
  } catch (e) {
    return { ok: false, greska: porukaZaUpis(e, "kategorija") };
  }

  osveziKatalog();
  return { ok: true, poruka: id ? "Izmene su sačuvane." : "Kategorija je napravljena." };
}

export async function obrisiKategorijuAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  await zahtevajAdmina();

  const id = String(podaci.get("id") ?? "");
  const kategorija = await adminRepository.nadjiKategoriju(id);
  if (!kategorija) return { ok: false, greska: "Kategorija ne postoji." };

  /*
   * Pravilo se proverava OVDE, nad svežim brojevima iz baze — ne nad onim što
   * je stranica prikazala. Između učitavanja ekrana i klika neko je mogao da
   * se registruje u toj kategoriji.
   */
  const sme = smeDaObriseKategoriju({
    brojMajstora: kategorija._count.majstori,
    brojUsluga: kategorija._count.serviceTypes,
  });
  if (!sme.sme) return { ok: false, greska: PORUKE_ZABRANE_BRISANJA[sme.razlog] };

  await adminRepository.obrisiKategoriju(id);
  osveziKatalog();
  redirect("/admin/kategorije");
}

/* ─────────────────── Usluge ─────────────────── */

export async function sacuvajUsluguAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  await zahtevajAdmina();

  const id = String(podaci.get("id") ?? "");
  const razdvojeno = uslugaSchema.safeParse({
    slug: podaci.get("slug"),
    categoryId: podaci.get("categoryId"),
    nameLatn: podaci.get("nameLatn"),
    nameCyrl: podaci.get("nameCyrl"),
    defaultUnit: podaci.get("defaultUnit"),
    allowedUnits: podaci.getAll("allowedUnits"),
    sortOrder: podaci.get("sortOrder") ?? "0",
    isActive: podaci.get("isActive") === "1",
  });

  if (!razdvojeno.success) return { ok: false, greska: prvaGreska(razdvojeno.error) };

  try {
    if (id) {
      await adminRepository.izmeniUslugu(id, razdvojeno.data);
    } else {
      await adminRepository.napraviUslugu(razdvojeno.data);
    }
  } catch (e) {
    return { ok: false, greska: porukaZaUpis(e, "usluga") };
  }

  osveziKatalog();
  return { ok: true, poruka: id ? "Izmene su sačuvane." : "Usluga je dodata." };
}

export async function obrisiUsluguAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  await zahtevajAdmina();

  const id = String(podaci.get("id") ?? "");
  const usluga = await adminRepository.nadjiUslugu(id);
  if (!usluga) return { ok: false, greska: "Usluga ne postoji." };

  const sme = smeDaObriseUslugu({ brojMajstora: usluga._count.majstorServices });
  if (!sme.sme) return { ok: false, greska: PORUKE_ZABRANE_BRISANJA[sme.razlog] };

  await adminRepository.obrisiUslugu(id);
  osveziKatalog();
  return { ok: true, poruka: "Usluga je obrisana." };
}

/* ─────────────────── Korisnici ─────────────────── */

const statusSchema = z.enum(["ACTIVE", "SUSPENDED", "BANNED"]);

export async function postaviStatusAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  const admin = await zahtevajAdmina();

  const userId = String(podaci.get("userId") ?? "");
  const trazeni = statusSchema.safeParse(podaci.get("status"));
  if (!trazeni.success) return { ok: false, greska: OPSTA_GRESKA };

  const meta = await adminRepository.nadjiKorisnika(userId);
  if (!meta) return { ok: false, greska: "Nalog ne postoji." };

  const sme = smeNadKorisnikom({
    akterId: admin.id,
    metaId: meta.id,
    metaUloga: meta.role as "USER" | "MAJSTOR" | "ADMIN",
    brojAdmina: await adminRepository.brojAdmina(),
  });
  if (!sme.sme) return { ok: false, greska: PORUKE_ZABRANE_NAD_KORISNIKOM[sme.razlog] };

  const status = trazeni.data as UserStatus;
  const posledica = posledicaStatusa(status);

  await adminRepository.postaviStatusKorisnika({ userId, status, ...posledica });

  /*
   * Ocene se preračunavaju samo kad su recenzije sklonjene — one koje je taj
   * nalog napisao više se ne broje, pa majstorov prosek mora da ih izgubi.
   */
  if (posledica.skloniRecenzije && meta._count.reviews > 0) {
    await preracunajOceneZaAutora(userId);
  }

  revalidatePath("/admin/korisnici");
  revalidatePath("/", "layout");
  return { ok: true, poruka: PORUKE_STATUSA[status] };
}

const PORUKE_STATUSA: Record<UserStatus, string> = {
  ACTIVE: "Nalog je vraćen u rad.",
  SUSPENDED: "Nalog je suspendovan i odjavljen sa svih uređaja.",
  BANNED: "Nalog je banovan, odjavljen, a njegove recenzije sklonjene.",
};

export async function odjaviSvudaAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  const admin = await zahtevajAdmina();

  const userId = String(podaci.get("userId") ?? "");
  if (userId === admin.id) {
    return { ok: false, greska: PORUKE_ZABRANE_NAD_KORISNIKOM["sam-sebi"] };
  }

  const broj = await adminRepository.obrisiSesije(userId);
  revalidatePath("/admin/korisnici");
  return {
    ok: true,
    poruka: broj === 0 ? "Nalog nije bio prijavljen ni na jednom uređaju." : `Odjavljeno: ${broj}.`,
  };
}

/* ─────────────────── Recenzije ─────────────────── */

export async function obrisiRecenzijuAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  await zahtevajAdmina();

  const id = String(podaci.get("id") ?? "");
  const majstorId = await adminRepository.obrisiRecenziju(id);
  if (!majstorId) return { ok: false, greska: "Recenzija ne postoji." };

  /* Brisanje bez preračuna ostavlja majstoru prosek od recenzije koje nema. */
  await reviewRepository.preracunajOcene(majstorId);

  revalidatePath("/admin/recenzije");
  revalidatePath("/", "layout");
  return { ok: true, poruka: "Recenzija je obrisana i ocena preračunata." };
}

export async function sacuvajBeleskuAction(
  _prethodno: Stanje | undefined,
  podaci: FormData,
): Promise<Stanje> {
  await zahtevajAdmina();

  const razdvojeno = beleskaSchema.safeParse({
    reviewId: podaci.get("reviewId"),
    note: podaci.get("note") ?? "",
  });
  if (!razdvojeno.success) return { ok: false, greska: prvaGreska(razdvojeno.error) };

  await adminRepository.postaviBelesku(razdvojeno.data.reviewId, razdvojeno.data.note);
  revalidatePath("/admin/recenzije");
  return { ok: true, poruka: "Beleška je sačuvana." };
}

/* ─────────────────── Pomoćno ─────────────────── */

/**
 * Katalog se čita na svakoj stranici — traka zanata, filteri, čarobnjak.
 * Zato izmena kategorije osvežava ceo layout, a ne samo admin ekran.
 */
function osveziKatalog() {
  revalidatePath("/admin/kategorije");
  revalidatePath("/", "layout");
}

async function preracunajOceneZaAutora(userId: string) {
  const majstori = await reviewRepository.majstoriSaRecenzijamaAutora(userId);
  for (const majstorId of majstori) await reviewRepository.preracunajOcene(majstorId);
}

/** Jedinstven slug je jedina greška baze koju admin može sam da ispravi. */
function porukaZaUpis(e: unknown, sta: "kategorija" | "usluga"): string {
  const kod = (e as { code?: string } | null)?.code;
  if (kod === "P2002") {
    return sta === "kategorija"
      ? "Kategorija sa tim slugom već postoji."
      : "Usluga sa tim slugom već postoji.";
  }
  console.error(`[admin] neuspeo upis (${sta}):`, e);
  return OPSTA_GRESKA;
}

"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { normalizeForSearch } from "@/lib/translit";
import { KLJUC, OGRANICENJA, proveriSliku, skladiste } from "@/lib/storage";
import type { PriceUnit } from "@/generated/prisma/enums";
import { majstorRepository } from "./repository";
import { korak1Schema, korak2Schema, korak3Schema, OPIS_NAJMANJE, type Stavka } from "./domain/wizard";
import { parsirajCenu } from "./domain/cena";
import { jedinstvenSlug, osnovaSluga } from "./domain/slug";

/**
 * Popunjavanje majstorskog profila.
 *
 * Sve ide POST-om kroz Server Actions — nijedan podatak o osobi ne završava u
 * adresi. U adresi stoji samo korak (`/registracija-majstora/zanat`), da nazad
 * dugme i osvežavanje rade.
 *
 * Svaki korak snima ZASEBNO. Čovek koji zatvori karticu na trećem koraku
 * nastavlja odatle, ne iz početka — to je razlog zašto koraka uopšte i ima.
 */

export type KorakStanje = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

function greskePolja(error: z.ZodError): Record<string, string> {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};

  for (const [polje, poruke] of Object.entries(fieldErrors)) {
    const prva = poruke?.[0];
    if (prva) out[polje] = prva;
  }
  return out;
}

export async function sacuvajKorak1Action(
  _prev: KorakStanje,
  formData: FormData,
): Promise<KorakStanje> {
  const user = await requireUser();

  /* Vraća se u formu posle neuspeha — bez JS-a bi sve otkucano nestalo. */
  const values = {
    displayName: String(formData.get("displayName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    primaryCategoryId: String(formData.get("primaryCategoryId") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    municipalityId: String(formData.get("municipalityId") ?? ""),
  };

  const parsed = korak1Schema.safeParse({
    ...values,
    /*
     * Glavni zanat se izbacuje iz dodatnih i kad je slučajno čekiran — inače bi
     * isti red dvaput ušao u spojnu tabelu.
     */
    dodatneKategorije: formData
      .getAll("dodatneKategorije")
      .map(String)
      .filter((id) => id && id !== values.primaryCategoryId),
  });
  if (!parsed.success) {
    return { fieldErrors: greskePolja(parsed.error), values };
  }

  const { displayName, phone, primaryCategoryId, dodatneKategorije, cityId, municipalityId } =
    parsed.data;

  /* Glavni uvek prvi — domen podrazumeva taj redosled. */
  const sveKategorije = [primaryCategoryId, ...new Set(dodatneKategorije)];

  /*
   * Id-jevi dolaze iz forme, pa se NE veruju. Neko može da pošalje bilo kakav
   * `cityId`; bez ove provere upis bi pao na stranom ključu uz grešku baze
   * umesto uz razumljivu poruku — ili bi, gore, prošao ako se šema ikad olabavi.
   */
  const [kategorija, grad] = await Promise.all([
    catalogRepository.findCategoryById(primaryCategoryId),
    geoRepository.findCityById(cityId),
  ]);

  if (!kategorija) return { fieldErrors: { primaryCategoryId: "Izaberite zanat sa spiska." }, values };
  if (!grad) return { fieldErrors: { cityId: "Izaberite grad sa spiska." }, values };

  /* Dodatni zanati dolaze iz forme, pa se isto ne veruju — svaki mora postojati. */
  const poznate = await catalogRepository.listCategories();
  const poznatiIds = new Set(poznate.map((k) => k.id));
  if (!sveKategorije.every((id) => poznatiIds.has(id))) {
    return { fieldErrors: { dodatneKategorije: "Izaberite zanate sa spiska." }, values };
  }

  /* Deo grada mora da pripada baš izabranom gradu — inače „Liman" u Nišu. */
  if (municipalityId) {
    const deo = await geoRepository.findMunicipalityById(municipalityId);
    if (!deo || deo.citySlug !== grad.slug) {
      return { fieldErrors: { municipalityId: "Izaberite deo grada sa spiska." }, values };
    }
  }

  /*
   * Telefon je `@unique` — jedan profil po broju. Provera je ovde da bi poruka
   * bila razumljiva; baza je i dalje poslednja brana ako dva zahteva stignu u
   * istom trenutku.
   */
  if (await majstorRepository.telefonZauzet(phone, user.id)) {
    return {
      fieldErrors: { phone: "Na ovaj broj telefona već postoji profil majstora." },
      values,
    };
  }

  const postojeci = await majstorRepository.findWizardProfile(user.id);

  /*
   * Slug se pravi SAMO pri kreiranju. Postojeći profil ga zadržava i kad
   * majstor promeni ime ili grad — adresa koju Google ima zapisanu ne sme da
   * se pomeri.
   */
  const slug =
    postojeci?.slug ??
    (await jedinstvenSlug(
      osnovaSluga(displayName, kategorija.nameSingular.latn, grad.name.latn),
      (kandidat) => majstorRepository.slugZauzet(kandidat),
    ));

  try {
    await majstorRepository.sacuvajKorak1(user.id, {
      displayName,
      phone,
      primaryCategoryId,
      sveKategorije,
      cityId,
      municipalityId,
      slug,
    });
  } catch (error) {
    /*
     * Trka: dva zahteva sa istim brojem u istom trenutku. Jedan prolazi, drugi
     * pada na jedinstvenosti — i mora da dobije istu poruku kao gornja provera,
     * a ne „Došlo je do greške".
     */
    if (jeGreskaJedinstvenosti(error, "phone")) {
      return {
        fieldErrors: { phone: "Na ovaj broj telefona već postoji profil majstora." },
        values,
      };
    }
    throw error;
  }

  /* Uloga se postavlja tek kad profil postoji — dotad je čovek običan korisnik. */
  if (user.role !== "MAJSTOR") {
    await db.user.update({ where: { id: user.id }, data: { role: "MAJSTOR" } });
  }

  /*
   * Izmena imena ili grada menja ono po čemu se majstor pronalazi. Objavljen
   * profil zato mora da osveži `searchText` — inače ga i dalje nalazi staro
   * ime, a novo ne nalazi ništa.
   */
  if (postojeci) await posleIzmene(postojeci.id, postojeci.status);

  redirect(posleKoraka(postojeci?.status ?? "DRAFT", "/registracija-majstora/usluge"));
}

/**
 * Korak 2 — usluge i cene.
 *
 * Forma šalje po tri polja za svaku uslugu: čekirano/ne, cena, jedinica.
 * Ključevi su dinamični (`cena-<id>`), pa se `FormData` prvo prevodi u spisak
 * stavki, a tek onda proverava šemom.
 */
export async function sacuvajKorak2Action(
  _prev: KorakStanje,
  formData: FormData,
): Promise<KorakStanje> {
  const user = await requireUser();
  const profil = await majstorRepository.findWizardProfile(user.id);

  /* Bez prvog koraka nema kategorije, pa nema ni usluga koje bi se nudile. */
  if (!profil) redirect("/registracija-majstora/zanat");

  const izabrane = formData.getAll("usluge").map(String).filter(Boolean);
  if (izabrane.length === 0) {
    return { error: "Izaberite bar jednu uslugu koju radite." };
  }

  /*
   * Ponuđene usluge se čitaju iz baze, ne iz forme. Tako `serviceTypeId` iz
   * tuđe kategorije — ili izmišljen — ne može da prođe, a usput se dobija i
   * spisak dozvoljenih jedinica za svaku.
   */
  const dozvoljene = await catalogRepository.listServiceTypes(profil.primaryCategoryId);
  const poId = new Map(dozvoljene.map((usluga) => [usluga.id, usluga]));

  const fieldErrors: Record<string, string> = {};
  const stavke: Stavka[] = [];

  for (const serviceTypeId of izabrane) {
    const usluga = poId.get(serviceTypeId);
    if (!usluga) {
      return { error: "Izabrana usluga ne pripada vašem zanatu. Osvežite stranicu i pokušajte ponovo." };
    }

    const cena = parsirajCenu(String(formData.get(`cena-${serviceTypeId}`) ?? ""));
    if (cena === undefined) {
      fieldErrors[`cena-${serviceTypeId}`] = "Unesite cenu u dinarima, na primer 1.500.";
      continue;
    }

    const jedinica = String(formData.get(`jedinica-${serviceTypeId}`) ?? usluga.defaultUnit);
    if (!usluga.allowedUnits.includes(jedinica as PriceUnit)) {
      fieldErrors[`jedinica-${serviceTypeId}`] = "Izaberite jedinicu sa spiska.";
      continue;
    }

    stavke.push({
      serviceTypeId,
      /* „Po dogovoru" i uneta cena se isključuju — cena uz tu jedinicu zbunjuje. */
      priceFromMinor: jedinica === "PO_DOGOVORU" ? null : cena,
      unit: jedinica as PriceUnit,
    });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const parsed = korak2Schema.safeParse({ stavke });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Proverite izabrane usluge." };
  }

  await majstorRepository.sacuvajKorak2(profil.id, parsed.data.stavke);
  await posleIzmene(profil.id, profil.status);

  redirect(posleKoraka(profil.status, "/registracija-majstora/profil"));
}

/**
 * Korak 3 — opis i godine iskustva.
 *
 * Slike se NE šalju ovom akcijom. One idu svojom, čim ih majstor izabere, pa
 * su gotove dok on još piše opis. Da idu zajedno, klik na „Sačuvaj" bi značio
 * čekanje na otpremanje nekoliko megabajta.
 */
export async function sacuvajKorak3Action(
  _prev: KorakStanje,
  formData: FormData,
): Promise<KorakStanje> {
  const user = await requireUser();
  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) redirect("/registracija-majstora/zanat");

  const values = {
    bio: String(formData.get("bio") ?? ""),
    yearsExperience: String(formData.get("yearsExperience") ?? ""),
  };

  const parsed = korak3Schema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: greskePolja(parsed.error), values };
  }

  await majstorRepository.sacuvajKorak3(profil.id, parsed.data);
  await posleIzmene(profil.id, profil.status);

  redirect(posleKoraka(profil.status, "/registracija-majstora/objava"));
}

/**
 * Otpremanje slike.
 *
 * Prima već isečenu i smanjenu sliku iz pretraživača — server ne obrađuje
 * fotografije. Obrada na serveru bi tražila `sharp`, procesor i vreme pri
 * svakom otpremanju, a pretraživač to isto radi besplatno dok korisnik bira
 * isečak.
 *
 * Provera se svejedno ponavlja ovde: zahtev može da stigne i bez naše forme.
 */
export async function otpremiSlikuAction(
  formData: FormData,
): Promise<{ url?: string; id?: string; error?: string }> {
  const user = await requireUser();
  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) return { error: "Prvo popunite zanat i lokaciju." };

  const fajl = formData.get("slika");
  if (!(fajl instanceof File)) return { error: "Nije poslata slika." };

  const provera = proveriSliku(fajl.type, fajl.size);
  if (!provera.ok) return { error: provera.poruka };

  const vrsta = String(formData.get("vrsta") ?? "avatar");
  if (vrsta === "rad") {
    const koliko = await majstorRepository.brojFotografija(profil.id);
    if (koliko >= OGRANICENJA.najviseFotografija) {
      return { error: `Možete dodati najviše ${OGRANICENJA.najviseFotografija} fotografija.` };
    }
  }

  /*
   * Nasumičan sufiks u ključu: bez njega bi nova slika pala na adresu stare,
   * koju pretraživači i CDN već drže u kešu — majstor promeni sliku, a
   * posetioci danima gledaju staru.
   */
  const sufiks = randomUUID().slice(0, 8);
  const kljuc =
    vrsta === "rad" ? KLJUC.fotografija(profil.id, sufiks) : KLJUC.avatar(profil.id, sufiks);

  const podaci = Buffer.from(await fajl.arrayBuffer());
  const skladisteInstanca = await skladiste();
  const sacuvan = await skladisteInstanca.sacuvaj(kljuc, podaci, fajl.type);

  if (vrsta === "rad") {
    /*
     * Id se VRAĆA, ne izvodi iz adrese. Bez njega brisanje nema po čemu da
     * pronađe red, pa bi fotografija nestala sa ekrana a ostala u bazi i na
     * disku — greška koja se vidi tek posle osvežavanja stranice.
     */
    const id = await majstorRepository.dodajFotografiju(profil.id, sacuvan.url);
    revalidatePath("/registracija-majstora/profil");
    return { url: sacuvan.url, id };
  }

  {
    /* Stari avatar se briše tek kad je nov upisan — da profil nikad ne ostane bez slike. */
    const stari = profil.avatarUrl;
    await majstorRepository.postaviAvatar(profil.id, sacuvan.url);
    if (stari) await obrisiPoUrl(stari);
  }

  revalidatePath("/registracija-majstora/profil");
  return { url: sacuvan.url };
}

export async function obrisiFotografijuAction(fotografijaId: string): Promise<void> {
  const user = await requireUser();
  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) return;

  /* Vlasništvo se proverava upitom, ne verom da id dolazi sa naše stranice. */
  const url = await majstorRepository.obrisiFotografiju(profil.id, fotografijaId);
  if (url) await obrisiPoUrl(url);

  revalidatePath("/registracija-majstora/profil");
}

/**
 * Korak 4 — objava.
 *
 * Profil prelazi u `ACTIVE` i tek tad postaje vidljiv u pretrazi. Verifikacija
 * telefona se zasad NE traži: nema SMS provajdera, a čekanje na nešto što ne
 * postoji zadržalo bi svakog majstora u nacrtu. `verificationLevel` ostaje
 * `NONE`, pa se uslov može uključiti kasnije bez prepravke ovog toka.
 */
export async function objaviProfilAction(): Promise<KorakStanje> {
  const user = await requireUser();
  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) redirect("/registracija-majstora/zanat");

  /*
   * Isti uslovi koje prikazuje pregled — provereni ponovo. Dugme se u UI-ju
   * onemogući, ali onemogućeno dugme nije zaštita.
   */
  if (profil.services.length === 0) {
    return { error: "Dodajte bar jednu uslugu pre objave." };
  }
  if (profil.bio.trim().length < OPIS_NAJMANJE) {
    return { error: `Opis mora da ima najmanje ${OPIS_NAJMANJE} znakova.` };
  }

  const tekst = await sklopiSearchText(profil.id);
  if (tekst === null) return { error: "Profil nije pronađen." };

  await majstorRepository.objavi(profil.id, tekst);

  /* Stranice sa listingom drže keširan spisak — nov majstor mora odmah da se vidi. */
  revalidatePath("/", "layout");

  redirect(`/majstor/${profil.slug}`);
}

/**
 * Sklapa `searchText` od svega po čemu bi neko mogao da traži majstora.
 *
 * Oba pisma ulaze, pa se sve svede istom funkcijom koju koristi i upit — bez
 * toga „keramicar cacak" ne nalazi „Keramičar, Čačak".
 */
async function sklopiSearchText(majstorId: string): Promise<string | null> {
  const podaci = await majstorRepository.podaciZaPretragu(majstorId);
  if (!podaci) return null;

  const delovi = [
    podaci.displayName,
    podaci.bio,
    podaci.primaryCategory.nameLatn,
    podaci.primaryCategory.nameCyrl,
    podaci.primaryCategory.nameSingularLatn,
    ...podaci.categories.flatMap((veza) => [
      veza.category.nameLatn,
      veza.category.nameCyrl,
      veza.category.nameSingularLatn,
    ]),
    podaci.city.nameLatn,
    podaci.city.nameCyrl,
    podaci.municipality?.nameLatn,
    podaci.municipality?.nameCyrl,
    ...podaci.services.flatMap((s) => [s.serviceType.nameLatn, s.serviceType.nameCyrl]),
  ].filter(Boolean);

  return normalizeForSearch(delovi.join(" "));
}

/**
 * Posle izmene objavljenog profila.
 *
 * Nacrt nema šta da osvežava — on nije ni u pretrazi. Objavljen profil mora,
 * inače ostaje pronalaziv po starim podacima.
 */
async function posleIzmene(majstorId: string, status: string): Promise<void> {
  if (status !== "ACTIVE") return;

  const tekst = await sklopiSearchText(majstorId);
  if (tekst !== null) await majstorRepository.azurirajSearchText(majstorId, tekst);

  /* Listing i profil se keširaju — izmena mora odmah da se vidi. */
  revalidatePath("/", "layout");
}

/**
 * Kuda posle sačuvanog koraka.
 *
 * Nacrt ide na sledeći korak — čovek popunjava profil prvi put i vodi ga se
 * kroz njega. Objavljen profil se vraća na nalog: tamo je čovek i krenuo da
 * menja jednu stvar, i tamo očekuje da se vrati.
 */
function posleKoraka(status: string, sledeci: string): string {
  return status === "ACTIVE" ? "/nalog" : sledeci;
}

/** Iz javne adrese vadi ključ u skladištu, pa briše fajl. */
async function obrisiPoUrl(url: string): Promise<void> {
  const kljuc = url.replace(/^https?:\/\/[^/]+\//, "").replace(/^\/?uploads\//, "");
  if (!kljuc.startsWith("majstori/")) return;
  const skladisteInstanca = await skladiste();
  await skladisteInstanca.obrisi(kljuc).catch(() => undefined);
}

/** Prisma P2002 — prekršen `@unique`. Tip se ne uvozi da klijent ne bi rastao. */
function jeGreskaJedinstvenosti(error: unknown, polje: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const greska = error as { code?: string; meta?: { target?: unknown } };
  if (greska.code !== "P2002") return false;

  const target = greska.meta?.target;
  return Array.isArray(target) ? target.includes(polje) : String(target ?? "").includes(polje);
}

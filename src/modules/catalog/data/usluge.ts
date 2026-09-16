import type { PriceUnit } from "@/generated/prisma/enums";

/**
 * Usluge po kategorijama — referentni podaci.
 *
 * Isti princip kao `geo/data/serbia.ts`: spisak stoji u kodu, seed ga upisuje u
 * bazu, aplikacija čita iz baze. Git pamti izmene, testovi ih proveravaju pre
 * upisa, a svi Postgresi — lokalni i produkcijski — dobiju isto jednom komandom.
 *
 * ── Zašto merna jedinica stoji uz uslugu, a ne uz majstora ──
 *
 * Moler ne sme da ponudi beljenje „po komadu", a bravar ne naplaćuje otvaranje
 * vrata „po kvadratu". Kad bi jedinicu birao majstor slobodno, cene u listingu
 * se ne bi mogle porediti — a poređenje cena je pola razloga zašto sajt postoji.
 * Zato svaka usluga nosi `jedinica` (podrazumevana) i `ostaleJedinice` (uzak
 * skup iz kog majstor sme da bira).
 *
 * „Po dogovoru" se dodaje automatski svuda — uvek postoji posao koji se ne da
 * unapred izmeriti.
 *
 * ── Kategorije ──
 *
 * Kategorije se ovde NE diraju. One već stoje u bazi sa uvodnim tekstovima koji
 * su pisani za SEO; prepisivanje bi ih pogazilo. Ovaj spisak dopunjuje samo
 * usluge unutar postojećih kategorija.
 */

export type Usluga = {
  slug: string;
  latn: string;
  /** Ručna ispravka ćirilice; izostavljeno znači „izvedi transliteracijom". */
  cyrl?: string;
  /** Podrazumevana jedinica — ona koja se nudi prva. */
  jedinica: PriceUnit;
  /**
   * Ceo skup dozvoljenih jedinica. Izostavljeno znači `[jedinica, PO_DOGOVORU]`,
   * što pokriva veliku većinu — navodi se samo kad usluga stvarno ima izbor.
   */
  ostaleJedinice?: PriceUnit[];
};

const u = (slug: string, latn: string, jedinica: PriceUnit, ostaleJedinice?: PriceUnit[]): Usluga => ({
  slug,
  latn,
  jedinica,
  ostaleJedinice,
});

/** Ključ je slug kategorije koja već postoji u bazi. */
export const USLUGE: Record<string, Usluga[]> = {
  moleri: [
    u("belenje-zidova", "Beljenje zidova", "M2"),
    u("farbanje-zidova", "Farbanje zidova", "M2"),
    u("gletovanje", "Gletovanje", "M2"),
    u("priprema-zidova", "Priprema zidova", "M2"),
    u("farbanje-stolarije", "Farbanje stolarije", "M2"),
    u("dekorativne-tehnike", "Dekorativne tehnike", "PO_DOGOVORU", ["PO_DOGOVORU", "M2", "SAT"]),
    u("postavljanje-tapeta", "Postavljanje tapeta", "M2"),
    u("uklanjanje-tapeta", "Uklanjanje starih tapeta", "M2"),
    u("fasaderski-radovi", "Fasaderski radovi", "M2"),
    u("farbanje-radijatora", "Farbanje radijatora", "KOMAD"),
  ],

  elektricari: [
    u("popravka-kvara", "Popravka kvara", "SAT"),
    u("elektro-instalacije", "Elektroinstalacije u stanu", "M2"),
    u("ugradnja-lustera", "Ugradnja lustera", "KOMAD"),
    u("zamena-uticnice", "Zamena utičnice ili prekidača", "KOMAD"),
    u("zamena-osiguraca", "Zamena osigurača", "KOMAD"),
    u("razvodna-tabla", "Ugradnja razvodne table", "KOMAD"),
    u("led-rasveta", "Ugradnja LED rasvete", "KOMAD"),
    u("interfon-video-nadzor", "Interfon i video nadzor", "KOMAD"),
    u("uzemljenje", "Uzemljenje i gromobran", "PO_DOGOVORU", ["PO_DOGOVORU", "M1", "DAN"]),
  ],

  vodoinstalateri: [
    u("odgusenje-odvoda", "Odgušenje odvoda", "SAT"),
    u("zamena-bojlera", "Zamena bojlera", "KOMAD"),
    u("ugradnja-sanitarija", "Ugradnja sanitarija", "KOMAD"),
    u("zamena-cevi", "Zamena vodovodnih cevi", "M1"),
    u("popravka-slavine", "Popravka slavine", "KOMAD"),
    u("ugradnja-tus-kabine", "Ugradnja tuš kabine", "KOMAD"),
    u("zamena-vodokotlica", "Zamena vodokotlića", "KOMAD"),
    u("trazenje-curenja", "Traženje curenja", "SAT"),
    u("prikljucenje-masine", "Priključenje veš ili sudo mašine", "KOMAD"),
    u("kupatilo-komplet", "Kompletno kupatilo", "PO_DOGOVORU", ["PO_DOGOVORU", "M2", "DAN"]),
  ],

  keramicari: [
    u("postavljanje-plocica", "Postavljanje pločica", "M2"),
    u("granitna-keramika", "Granitna keramika", "M2"),
    u("fugovanje", "Fugovanje", "M2"),
    u("rusenje-plocica", "Rušenje stare keramike", "M2"),
    u("kupatilo-plocice", "Pločice u kupatilu", "M2"),
    u("postavljanje-mozaika", "Postavljanje mozaika", "M2"),
    u("hidroizolacija", "Hidroizolacija pre keramike", "M2"),
    u("postavljanje-sokle", "Postavljanje sokle", "M1"),
  ],

  stolari: [
    u("kuhinja-po-meri", "Kuhinja po meri", "PO_DOGOVORU", ["PO_DOGOVORU", "M1", "SAT"]),
    u("plakar-po-meri", "Plakar po meri", "M2"),
    u("montaza-namestaja", "Montaža nameštaja", "SAT"),
    u("popravka-vrata", "Popravka vrata", "KOMAD"),
    u("ugradnja-vrata", "Ugradnja vrata", "KOMAD"),
    u("popravka-namestaja", "Popravka nameštaja", "SAT"),
    u("police-i-radni-sto", "Police i radni sto", "PO_DOGOVORU", ["PO_DOGOVORU", "M1", "KOMAD"]),
    u("drvene-obloge", "Drvene obloge zidova", "M2"),
  ],

  "klima-uredjaji": [
    u("ugradnja-klime", "Ugradnja klima uređaja", "KOMAD"),
    u("servis-klime", "Servis i čišćenje klime", "KOMAD"),
    u("dopuna-freona", "Dopuna freona", "KOMAD"),
    u("demontaza-klime", "Demontaža klime", "KOMAD"),
    u("premestanje-klime", "Premeštanje klime", "KOMAD"),
    u("multi-split", "Ugradnja multi split sistema", "KOMAD"),
    u("popravka-klime", "Popravka klima uređaja", "SAT"),
  ],

  "gradjevinski-radovi": [
    u("zidanje", "Zidanje", "M2"),
    u("malterisanje", "Malterisanje", "M2"),
    u("ab-radovi", "Armirano-betonski radovi", "DAN", ["DAN", "SAT", "PO_DOGOVORU"]),
    u("rusenje-i-odvoz", "Rušenje i odvoz šuta", "DAN", ["DAN", "SAT", "PO_DOGOVORU"]),
    u("estrih", "Estrih i košuljica", "M2"),
    u("termoizolacija-fasade", "Termoizolacija fasade", "M2"),
    u("gips-pregrade", "Gipsane pregrade", "M2"),
    u("spusteni-plafoni", "Spušteni plafoni", "M2"),
    u("betoniranje-staza", "Betoniranje staza i prilaza", "M2"),
    u("iskop", "Iskop i pripremni radovi", "DAN", ["DAN", "M2", "PO_DOGOVORU"]),
  ],

  bravari: [
    u("hitno-otvaranje", "Hitno otvaranje vrata", "KOMAD"),
    u("zamena-brave", "Zamena brave", "KOMAD"),
    u("izrada-ograde", "Izrada ograde", "M1"),
    u("izrada-kapije", "Izrada kapije", "KOMAD", ["KOMAD", "M2", "PO_DOGOVORU"]),
    u("montaza-gelendera", "Montaža gelendera", "M1"),
    u("sigurnosna-vrata", "Ugradnja sigurnosnih vrata", "KOMAD"),
    u("resetke-na-prozore", "Rešetke na prozore", "KOMAD", ["KOMAD", "M2", "PO_DOGOVORU"]),
    u("varenje", "Varenje i popravke", "SAT"),
  ],

  parketari: [
    u("postavljanje-parketa", "Postavljanje parketa", "M2"),
    u("hoblovanje-lakiranje", "Hoblovanje i lakiranje", "M2"),
    u("postavljanje-laminata", "Postavljanje laminata", "M2"),
    u("postavljanje-vinila", "Postavljanje vinila", "M2"),
    u("postavljanje-lajsni", "Postavljanje lajsni", "M1"),
    u("popravka-parketa", "Popravka parketa", "M2"),
    u("uljenje-parketa", "Uljenje i voskiranje", "M2"),
  ],
};

/** „Po dogovoru" postoji uz svaku uslugu — uvek ima posao koji se ne meri unapred. */
export function dozvoljeneJedinice(usluga: Usluga): PriceUnit[] {
  if (usluga.ostaleJedinice) return usluga.ostaleJedinice;
  return usluga.jedinica === "PO_DOGOVORU" ? ["PO_DOGOVORU"] : [usluga.jedinica, "PO_DOGOVORU"];
}

/** Sve usluge spljoštene, sa slug-om kategorije i redosledom unutar nje. */
export const SVE_USLUGE = Object.entries(USLUGE).flatMap(([kategorijaSlug, usluge]) =>
  usluge.map((usluga, i) => ({ ...usluga, kategorijaSlug, sortOrder: i })),
);

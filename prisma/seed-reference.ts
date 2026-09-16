/**
 * Seed referentnih podataka — gradovi, delovi grada i usluge.
 *
 * Odvojen od `seed.ts` namerno, i razlika je bitna:
 *
 *   `db:seed`      demo podaci. BRIŠE majstore, korisnike i recenzije, pa ih
 *                  pravi iznova. Samo za razvoj.
 *   `db:seed:ref`  stvarni podaci. Ništa ne briše osim delova grada koje niko
 *                  ne koristi. Sme da se pokrene i nad produkcijom.
 *
 * Kategorije nisu ovde: one već stoje u bazi sa uvodnim tekstovima pisanim za
 * SEO, pa bi ih prepisivanje pogazilo.
 *
 * Gradovi nisu demo sadržaj — na njih pokazuju profili pravih majstora. Da su
 * ostali u demo seed-u, svako osvežavanje demo podataka bi im promenilo id i
 * pokidalo veze.
 *
 * Radi kroz `upsert` po slug-u, pa je bezbedno pokrenuti ga koliko god puta:
 * postojeći gradovi zadrže svoj id, novi se dodaju, imena se osveže.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { GRADOVI } from "../src/modules/geo/data/serbia";
import { dozvoljeneJedinice, SVE_USLUGE } from "../src/modules/catalog/data/usluge";
import { toCyrillic } from "../src/lib/translit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL nije postavljen.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Ćirilica se izvodi; `cyrl` polje postoji samo za slučaj da pravilo omaši. */
const cyr = (latn: string, rucno?: string) => rucno ?? toCyrillic(latn);

async function main() {
  let noviGradovi = 0;
  let noviDelovi = 0;

  for (const grad of GRADOVI) {
    const postojeci = await db.city.findUnique({ where: { slug: grad.slug }, select: { id: true } });
    if (!postojeci) noviGradovi += 1;

    const podaci = {
      nameLatn: grad.latn,
      nameCyrl: cyr(grad.latn, grad.cyrl),
      nameLocativeLatn: grad.lokativ,
      nameLocativeCyrl: cyr(grad.lokativ),
      regionLatn: grad.okrug,
      regionCyrl: cyr(grad.okrug),
      lat: grad.lat,
      lng: grad.lng,
      population: grad.stanovnika,
    };

    const zapisan = await db.city.upsert({
      where: { slug: grad.slug },
      create: { slug: grad.slug, ...podaci },
      update: podaci,
    });

    for (const deo of grad.delovi) {
      const podaciDela = { nameLatn: deo.latn, nameCyrl: cyr(deo.latn, deo.cyrl) };

      const postojeciDeo = await db.municipality.findUnique({
        /* Slug je jedinstven po gradu — „palilula" postoji i u Beogradu i u Nišu. */
        where: { cityId_slug: { cityId: zapisan.id, slug: deo.slug } },
        select: { id: true },
      });
      if (!postojeciDeo) noviDelovi += 1;

      await db.municipality.upsert({
        where: { cityId_slug: { cityId: zapisan.id, slug: deo.slug } },
        create: { cityId: zapisan.id, slug: deo.slug, ...podaciDela },
        update: podaciDela,
      });
    }

    /*
     * Delovi koji više nisu na listi (npr. izmišljeni „Centar" iz demo podataka)
     * se brišu — ali SAMO ako ih nijedan majstor ne koristi. Profil pravog
     * majstora ne sme da izgubi lokaciju zato što smo sredili spisak.
     */
    const zaBrisanje = await db.municipality.findMany({
      where: {
        cityId: zapisan.id,
        slug: { notIn: grad.delovi.map((deo) => deo.slug) },
        majstori: { none: {} },
      },
      select: { id: true, nameLatn: true },
    });

    if (zaBrisanje.length > 0) {
      await db.municipality.deleteMany({ where: { id: { in: zaBrisanje.map((m) => m.id) } } });
      console.log(
        `  ${grad.latn}: uklonjeno ${zaBrisanje.length} nekorišćenih delova (${zaBrisanje
          .map((m) => m.nameLatn)
          .join(", ")})`,
      );
    }
  }

  const noveUsluge = await seedUsluge();

  console.log(
    `\nGradovi: ${await db.city.count()} (novih: ${noviGradovi})\n` +
      `Delovi grada: ${await db.municipality.count()} (novih: ${noviDelovi})\n` +
      `Usluge: ${await db.serviceType.count()} (novih: ${noveUsluge})\n`,
  );
}

/**
 * Usluge po kategorijama.
 *
 * Kategorije se NE diraju — one već stoje u bazi sa uvodnim tekstovima pisanim
 * za SEO, i prepisivanje bi ih pogazilo. Ovde se dopunjuju samo usluge unutar
 * njih.
 *
 * Usluge se nikad ne brišu, čak ni kad nestanu sa spiska. Na `MajstorService`
 * visi cena koju je majstor uneo; brisanje usluge obrisalo bi i nju. Umesto
 * toga bi se gasila kroz `isActive` — prestaje da se nudi novima, a cena
 * postojećih ostaje.
 */
async function seedUsluge() {
  let nove = 0;

  for (const usluga of SVE_USLUGE) {
    const kategorija = await db.category.findUnique({
      where: { slug: usluga.kategorijaSlug },
      select: { id: true },
    });

    if (!kategorija) {
      console.warn(`  preskočeno: kategorija „${usluga.kategorijaSlug}" ne postoji u bazi`);
      continue;
    }

    const postojeca = await db.serviceType.findUnique({
      where: { slug: usluga.slug },
      select: { id: true },
    });
    if (!postojeca) nove += 1;

    const podaci = {
      categoryId: kategorija.id,
      nameLatn: usluga.latn,
      nameCyrl: cyr(usluga.latn, usluga.cyrl),
      defaultUnit: usluga.jedinica,
      allowedUnits: dozvoljeneJedinice(usluga),
      sortOrder: usluga.sortOrder,
      isActive: true,
    };

    await db.serviceType.upsert({
      where: { slug: usluga.slug },
      create: { slug: usluga.slug, ...podaci },
      update: podaci,
    });
  }

  return nove;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

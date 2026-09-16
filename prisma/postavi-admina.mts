import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Prvi administrator.
 *
 * Ne postoji ekran koji ovo radi, jer bi taj ekran morao da bude dostupan bez
 * prijave — a to je onda ulaz koji svako može da nađe. Ne postoji ni admin u
 * seed-u: nalog sa unapred poznatom lozinkom koji dođe zajedno sa kodom je
 * najstarija rupa u knjizi.
 *
 * Uloga se dodeljuje POSTOJEĆEM nalogu. Čovek se prvo registruje kroz sajt kao
 * i svi ostali, pa mu neko sa pristupom bazi podigne ulogu:
 *
 *   npm run admin:postavi -- ime@primer.rs
 *
 * Skidanje uloge ide istom komandom sa `--skini`.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const argumenti = process.argv.slice(2);
const skini = argumenti.includes("--skini");
const email = argumenti.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

if (!email) {
  console.error("Upotreba: npm run admin:postavi -- ime@primer.rs [--skini]");
  process.exit(1);
}

const korisnik = await prisma.user.findUnique({
  where: { email },
  select: { id: true, email: true, role: true, majstor: { select: { id: true } } },
});

if (!korisnik) {
  console.error(`Nema naloga sa e-poštom ${email}. Registrujte se kroz sajt pa pokrenite ponovo.`);
  await prisma.$disconnect();
  process.exit(1);
}

if (skini) {
  /*
   * Poslednji admin se ne skida — sistem bi ostao bez ijednog naloga koji može
   * da uđe u administraciju, a povratka nema bez ručne izmene baze.
   */
  const brojAdmina = await prisma.user.count({ where: { role: "ADMIN" } });
  if (korisnik.role === "ADMIN" && brojAdmina <= 1) {
    console.error("Ovo je poslednji administrator — skidanje bi ostavilo sistem bez pristupa.");
    await prisma.$disconnect();
    process.exit(1);
  }

  /* Ko ima profil majstora vraća se u MAJSTOR, ostali u USER. */
  const uloga = korisnik.majstor ? "MAJSTOR" : "USER";
  await prisma.user.update({ where: { id: korisnik.id }, data: { role: uloga } });
  console.log(`${email}: ADMIN → ${uloga}`);
} else {
  if (korisnik.role === "ADMIN") {
    console.log(`${email} je već administrator.`);
  } else {
    await prisma.user.update({ where: { id: korisnik.id }, data: { role: "ADMIN" } });
    console.log(`${email}: ${korisnik.role} → ADMIN`);

    if (korisnik.majstor) {
      console.log(
        "Napomena: nalog ima profil majstora. Dok je ADMIN, „Moj nalog\" ga ne prikazuje kao majstora.",
      );
    }
  }
}

await prisma.$disconnect();

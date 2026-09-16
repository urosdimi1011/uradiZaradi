import "server-only";

import type { CityModel, MunicipalityModel } from "@/generated/prisma/models";
import { db } from "@/lib/db";
import type { City, Municipality } from "./domain";

/**
 * Pristup podacima o geografiji.
 *
 * Ovo je jedini sloj koji zna da podaci dolaze iz Postgresa. Servisi i UI i
 * dalje dobijaju domenske tipove — zato mapiranje postoji.
 *
 * Kolone su u bazi razložene (`nameLatn` + `nameCyrl`) da bi mogle da se
 * indeksiraju i sortiraju; domen ih vidi kao jedan `LocalizedText`. Prevod ide
 * ovde, a ne u UI-ju, da promena šeme ne prokapa kroz aplikaciju.
 *
 * Rezultat se NE proverava Zod-om kao nekad JSON: oblik garantuju Prisma tipovi
 * pri kompajliranju, pa bi provera na svakom upitu bila trošak bez dobitka.
 * JSON je bio ručno generisan i mogao je da odstupi; tabela ne može.
 */

type MunicipalityWithCity = MunicipalityModel & { city: { slug: string } };

function toCity(row: CityModel): City {
  return {
    id: row.id,
    slug: row.slug,
    name: { latn: row.nameLatn, cyrl: row.nameCyrl },
    nameLocative: { latn: row.nameLocativeLatn, cyrl: row.nameLocativeCyrl },
    region: { latn: row.regionLatn, cyrl: row.regionCyrl },
    lat: row.lat,
    lng: row.lng,
    population: row.population,
  };
}

function toMunicipality(row: MunicipalityWithCity): Municipality {
  return {
    id: row.id,
    // Domen radi sa slugom grada; baza čuva strani ključ. Spoj je ovde.
    citySlug: row.city.slug,
    slug: row.slug,
    name: { latn: row.nameLatn, cyrl: row.nameCyrl },
  };
}

export const geoRepository = {
  async listCities(): Promise<City[]> {
    const rows = await db.city.findMany({ orderBy: { population: "desc" } });
    return rows.map(toCity);
  },

  async findCityBySlug(slug: string): Promise<City | null> {
    const row = await db.city.findUnique({ where: { slug } });
    return row ? toCity(row) : null;
  },

  async findCityById(id: string): Promise<City | null> {
    const row = await db.city.findUnique({ where: { id } });
    return row ? toCity(row) : null;
  },

  async listMunicipalities(citySlug: string): Promise<Municipality[]> {
    const rows = await db.municipality.findMany({
      where: { city: { slug: citySlug } },
      include: { city: { select: { slug: true } } },
      orderBy: { nameLatn: "asc" },
    });
    return rows.map(toMunicipality);
  },

  async findMunicipalityById(id: string): Promise<Municipality | null> {
    const row = await db.municipality.findUnique({
      where: { id },
      include: { city: { select: { slug: true } } },
    });
    return row ? toMunicipality(row) : null;
  },
};

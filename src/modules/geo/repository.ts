import "server-only";
import { db } from "@/data";
import type { City, Municipality } from "./domain";

export const geoRepository = {
  async listCities(): Promise<City[]> {
    return [...db.cities].sort((a, b) => b.population - a.population);
  },

  async findCityBySlug(slug: string): Promise<City | null> {
    return db.cities.find((c) => c.slug === slug) ?? null;
  },

  async findCityById(id: string): Promise<City | null> {
    return db.cities.find((c) => c.id === id) ?? null;
  },

  async listMunicipalities(citySlug: string): Promise<Municipality[]> {
    return db.municipalities.filter((m) => m.citySlug === citySlug);
  },

  async findMunicipalityById(id: string): Promise<Municipality | null> {
    return db.municipalities.find((m) => m.id === id) ?? null;
  },
};

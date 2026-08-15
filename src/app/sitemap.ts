import type { MetadataRoute } from "next";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { majstorRepository } from "@/modules/majstori/repository";
import { isMajstorIndexable } from "@/modules/majstori/domain";
import { abs } from "@/lib/site";

/**
 * Programatski SEO motor.
 *
 * Kombinacija kategorija × grad generiše stotine landing stranica — to je glavni
 * izvor organskog saobraćaja. Ali stranica sa dva majstora je thin content, pa se
 * u sitemap upisuju samo kombinacije sa najmanje MIN_MAJSTORI profila.
 *
 * U Fazi 1 se deli na više sitemap fajlova (Next `generateSitemaps`) — limit je
 * 50.000 URL-ova po fajlu, što se sa ~10 kategorija × ~150 gradova brzo dostigne.
 */
const MIN_MAJSTORI_PER_LANDING = 3;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, cities] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "daily", priority: 1 },
    { url: abs("/kategorije"), changeFrequency: "weekly", priority: 0.6 },
  ];

  for (const category of categories) {
    entries.push({
      url: abs(`/${category.slug}`),
      changeFrequency: "daily",
      priority: 0.9,
    });

    for (const city of cities) {
      const count = await majstorRepository.countByCategoryAndCity(category.id, city.id);
      if (count < MIN_MAJSTORI_PER_LANDING) continue;

      entries.push({
        url: abs(`/${category.slug}-${city.slug}`),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  const slugs = await majstorRepository.listSlugs();
  for (const slug of slugs) {
    const majstor = await majstorRepository.findBySlug(slug);
    // Profil ispod praga kvaliteta nosi `noindex`; slanje takvog URL-a u sitemap
    // je kontradiktoran signal i Google ga tretira kao grešku.
    if (!majstor || !isMajstorIndexable(majstor)) continue;

    entries.push({
      url: abs(`/majstor/${slug}`),
      lastModified: majstor.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}

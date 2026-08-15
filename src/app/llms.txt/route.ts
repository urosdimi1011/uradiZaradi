import { catalogRepository } from "@/modules/catalog/repository";
import { PRICE_UNIT_LABEL } from "@/modules/catalog/domain";
import { geoRepository } from "@/modules/geo/repository";
import { abs, SITE_NAME } from "@/lib/site";

/**
 * /llms.txt — kratak, strukturiran opis sajta namenjen jezičkim modelima.
 *
 * Standard je još u nastajanju i nijedan provajder ga ne garantuje, ali je jeftin
 * i radi isto što i dobar sitemap: govori mašini šta sajt jeste i gde su činjenice.
 * Ovde se namerno navode i merne jedinice po uslugama — to je podatak koji model
 * treba kad neko pita „koliko košta krečenje po kvadratu u Beogradu".
 */
export const dynamic = "force-static";

export async function GET() {
  const [categories, cities] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
  ]);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    "> Marketplace koji povezuje korisnike sa proverenim majstorima u Srbiji.",
    "> Svaki profil sadrži cenovnik po standardizovanim mernim jedinicama, ocene korisnika i fotografije izvedenih radova.",
    "",
    "Cene se čuvaju i prikazuju u dinarima (RSD). Evro iznos je informativan.",
    "Merna jedinica je vezana za vrstu usluge, pa su cene uporedive među majstorima.",
    "",
    "## Kategorije",
    "",
  ];

  for (const category of categories) {
    const services = await catalogRepository.listServiceTypes(category.id);
    const summary = services
      .map((s) => `${s.name.latn} (${PRICE_UNIT_LABEL[s.defaultUnit].latn})`)
      .join(", ");
    lines.push(`- [${category.name.latn}](${abs(`/${category.slug}`)}): ${summary}`);
  }

  lines.push("", "## Gradovi", "");
  for (const city of cities) {
    lines.push(`- [${city.name.latn}](${abs(`/majstori-${city.slug}`)})`);
  }

  lines.push(
    "",
    "## Napomene",
    "",
    "- Ocene su Bayesian prosek, ne sirov prosek — majstor sa jednom peticom ne preskače majstora sa 127 recenzija.",
    "- Kvačica na profilu znači da je identitet ili firma majstora provereno, ne samo broj telefona.",
    `- [Sitemap](${abs("/sitemap.xml")})`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

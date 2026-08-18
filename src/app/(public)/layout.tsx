import { PublicLayout } from "@/components/layouts/public/public-layout";
import { getScript } from "@/lib/script.server";
import { catalogRepository } from "@/modules/catalog/repository";

/**
 * Granica javnog dela sajta.
 *
 * `(public)` je Next-ova route grupa — zagrade znače da segment NE ulazi u URL,
 * pa `/` i `/majstor/...` ostaju kakvi jesu. Grupa postoji samo da bi javni deo
 * i budući `(admin)` imali odvojene omotače.
 *
 * Ručno umotavanje svake stranice u <PublicLayout> radilo bi isto, ali bi se
 * layout remountovao pri svakoj navigaciji i lako bi se zaboravio na novoj ruti.
 * Ovako Next drži okvir u životu i menja samo sadržaj.
 */
export default async function PublicGroupLayout({ children }: LayoutProps<"/">) {
  const [script, categories] = await Promise.all([
    getScript(),
    catalogRepository.listCategories(),
  ]);

  return (
    <PublicLayout script={script} categories={categories}>
      {children}
    </PublicLayout>
  );
}

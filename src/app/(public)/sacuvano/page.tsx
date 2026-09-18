import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { MajstorCard } from "@/modules/majstori/ui/majstor-card";
import { getMajstorCards } from "@/modules/majstori/service";
import { savedRepository } from "@/modules/saved/repository";
import { getCurrentUser } from "@/lib/session";
import { makeT } from "@/lib/dictionary";
import { getScript } from "@/lib/script.server";

export const metadata: Metadata = {
  title: "Sačuvani majstori",
  /* Lista je lična — nema šta da se indeksira, a i traži prijavu. */
  robots: { index: false, follow: false },
};

/**
 * Sačuvani majstori.
 *
 * Vezano za NALOG, ne za uređaj: čovek koji je sačuvao deset majstora na
 * telefonu očekuje da ih nađe i na računaru. Zato gost ide na prijavu, a ne na
 * praznu listu.
 */
export default async function SacuvanoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/prijava?next=%2Fsacuvano");

  const script = await getScript();
  const t = makeT(script);

  /*
   * Redosled dolazi iz `listIds` (najnoviji prvi) i mora da preživi dohvatanje
   * majstora — baza vraća po svom redosledu, pa se ovde vraća na naš.
   */
  const ids = await savedRepository.listIds(user.id);
  const kartice = await getMajstorCards(ids);
  const poId = new Map(kartice.map((k) => [k.id, k]));
  const poredjane = ids.map((id) => poId.get(id)).filter((k) => k !== undefined);

  return (
    <div className="page-container py-8 lg:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-content-primary">{t("saved")}</h1>
        <p className="mt-1.5 text-sm text-content-secondary">
          {poredjane.length > 0
            ? `${poredjane.length} ${poredjane.length === 1 ? "majstor" : "majstora"}`
            : null}
        </p>
      </header>

      {poredjane.length === 0 ? (
        <EmptyState
          icon={Heart}
          naslov={t("noSavedTitle")}
          opis={t("noSavedHint")}
          akcija={
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-brand-foreground"
            >
              {t("browseMajstori")}
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {poredjane.map((majstor, i) => (
            <li key={majstor.id} className="flex">
              {/* Svi su po definiciji sačuvani — srce je puno od prvog kadra. */}
              <MajstorCard
                majstor={majstor}
                script={script}
                priority={i < 3}
                sacuvan
                prijavljen
                prijavljeniId={user.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

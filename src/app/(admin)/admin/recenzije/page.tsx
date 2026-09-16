import { MessageSquare, Star, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { majstorRepository } from "@/modules/majstori/repository";
import { reviewRepository } from "@/modules/reviews/repository";
import { ModeracijaDugmad } from "@/modules/reviews/ui/moderacija-dugmad";
import { obrisiRecenzijuAction, sacuvajBeleskuAction } from "@/modules/admin/actions";
import { AdminForma } from "../_ui/poruka-akcije";

/**
 * Red recenzija koje čekaju odluku.
 *
 * Ovde stižu samo one sa ocenom ispod praga — pozitivne se objavljuju same.
 * Zato je red kratak i pregleda se za par minuta, umesto da moderacija bude
 * posao za sebe.
 */
export default async function AdminRecenzijePage() {
  const naCekanju = await reviewRepository.listPending();

  /* Imena majstora u jednom prolazu — bez toga bi svaki red bio svoj upit. */
  const majstori = await majstorRepository.findActiveByIds(naCekanju.map((r) => r.majstorId));
  const imePoId = new Map(majstori.map((m) => [m.id, { ime: m.displayName, slug: m.slug }]));

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-content-primary">Recenzije na čekanju</h1>
      <p className="mt-1.5 text-sm text-content-secondary">
        Ovde stižu samo recenzije sa nižom ocenom. Pozitivne se objavljuju automatski.
      </p>

      {naCekanju.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          naslov="Red je prazan"
          opis="Nema recenzija koje čekaju pregled."
          className="mt-6 max-w-md"
        />
      ) : (
        <ul className="mt-6 flex max-w-3xl flex-col gap-3">
          {naCekanju.map((r) => {
            const majstor = imePoId.get(r.majstorId);

            return (
              <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface-card p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold text-content-primary">
                    <Star width={14} height={14} className="fill-brand text-brand" aria-hidden />
                    {r.rating}
                  </span>
                  <span className="text-content-secondary">{r.authorDisplayName}</span>
                  <span className="text-content-muted">→</span>
                  <a
                    href={majstor ? `/majstor/${majstor.slug}` : "#"}
                    className="text-brand hover:underline"
                  >
                    {majstor?.ime ?? "nepoznat majstor"}
                  </a>
                  <time
                    dateTime={r.createdAt.toISOString()}
                    className="ml-auto text-xs text-content-muted"
                  >
                    {r.createdAt.toLocaleDateString("sr-Latn-RS")}
                  </time>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-content-secondary">{r.body}</p>

                <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-line pt-3.5">
                  <ModeracijaDugmad reviewId={r.id} />

                  {/*
                    Brisanje je odvojeno od odbijanja i namerno izgleda drugačije.
                    Odbijena recenzija ostaje u bazi i može da se vrati; obrisana
                    nestaje, a majstoru se prosek preračunava.
                  */}
                  <AdminForma
                    akcija={obrisiRecenzijuAction}
                    potvrda="Trajno obrisati recenziju? Ovo se ne može poništiti — odbijanje je bolje ako niste sigurni."
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-danger hover:underline"
                    >
                      <Trash2 width={13} height={13} aria-hidden />
                      Obriši
                    </button>
                  </AdminForma>
                </div>

                {/* Beleška ostaje unutra — trag za sledećeg ko otvori isti slučaj. */}
                <AdminForma akcija={sacuvajBeleskuAction} className="mt-3">
                  <input type="hidden" name="reviewId" value={r.id} />
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-content-secondary">
                      Interna beleška
                    </span>
                    <textarea
                      name="note"
                      rows={2}
                      defaultValue={r.moderatorNote ?? ""}
                      placeholder="Zašto je zadržana ili odbijena. Ne vidi je niko osim administracije."
                      className="w-full rounded-[var(--radius-control)] border border-line bg-surface-input px-3 py-2 text-xs text-content-primary"
                    />
                  </label>
                  <button
                    type="submit"
                    className="mt-2 text-xs font-medium text-content-secondary hover:text-content-primary"
                  >
                    Sačuvaj belešku
                  </button>
                </AdminForma>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

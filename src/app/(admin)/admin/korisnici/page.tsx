import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";

import { adminRepository } from "@/modules/admin/repository";
import { RadnjeNadNalogom } from "./_ui/radnje";

export const metadata = { title: "Korisnici" };

const STATUS_LABEL = {
  ACTIVE: { tekst: "Aktivan", klasa: "text-success" },
  SUSPENDED: { tekst: "Suspendovan", klasa: "text-brand" },
  BANNED: { tekst: "Banovan", klasa: "text-danger" },
} as const;

export default async function AdminKorisniciPage({
  searchParams,
}: PageProps<"/admin/korisnici">) {
  const raw = await searchParams;
  const upit = typeof raw.q === "string" ? raw.q : undefined;

  const korisnici = await adminRepository.listKorisnike({ upit });

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-content-primary">Korisnici</h1>
      <p className="mt-1 text-sm text-content-secondary">
        Suspenzija sklanja profil i odjavljuje nalog. Ban dodatno sklanja recenzije koje je taj
        nalog napisao i preračunava ocene majstorima kojima ih je ostavio.
      </p>

      {/* Obična GET forma — rezultat je deljiva adresa i radi bez JavaScripta. */}
      <form method="get" className="mt-5 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search
            width={15}
            height={15}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={upit}
            placeholder="E-pošta ili ime"
            aria-label="Pretraga naloga"
            className="h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface-input pl-9 pr-3 text-sm text-content-primary"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-[var(--radius-control)] border border-line-strong px-4 text-sm text-content-primary"
        >
          Nađi
        </button>
      </form>

      <p className="mt-4 text-xs text-content-muted">
        {korisnici.length === 0
          ? "Nema naloga za taj upit."
          : `Prikazano ${korisnici.length}${korisnici.length === 100 ? " (najnovijih 100)" : ""}.`}
      </p>

      <div className="mt-3 space-y-3">
        {korisnici.map((k) => {
          const status = STATUS_LABEL[k.status as keyof typeof STATUS_LABEL];

          return (
            <div
              key={k.id}
              className="rounded-[var(--radius-card)] border border-line bg-surface-card p-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-content-primary">{k.displayName}</span>
                <span className="text-xs text-content-secondary">{k.email}</span>
                <span className="rounded-[var(--radius-sm)] bg-surface-hover px-2 py-0.5 text-xs text-content-secondary">
                  {k.role}
                </span>
                <span className={`text-xs ${status.klasa}`}>{status.tekst}</span>

                {k.majstor ? (
                  <Link
                    href={`/majstor/${k.majstor.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-content-muted hover:text-brand"
                  >
                    profil
                    <ExternalLink width={11} height={11} aria-hidden />
                  </Link>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-content-muted">
                {k._count.reviews} recenzija · {k._count.sessions} aktivnih sesija · od{" "}
                {k.createdAt.toISOString().slice(0, 10)}
              </p>

              <RadnjeNadNalogom
                userId={k.id}
                uloga={k.role as "USER" | "MAJSTOR" | "ADMIN"}
                status={k.status as "ACTIVE" | "SUSPENDED" | "BANNED"}
                imaSesije={k._count.sessions > 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

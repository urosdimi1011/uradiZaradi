import Link from "next/link";
import { EyeOff, Plus } from "lucide-react";

import { adminRepository } from "@/modules/admin/repository";
import { smeDaObriseKategoriju } from "@/modules/admin/domain/pravila";

export const metadata = { title: "Kategorije" };

export default async function AdminKategorijePage() {
  const kategorije = await adminRepository.listKategorije();

  return (
    <div className="page-container py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary">Kategorije</h1>
          <p className="mt-1 text-sm text-content-secondary">
            {kategorije.length} zanata. Ugašena kategorija ostaje na svojoj adresi, ali se ne nudi
            novim majstorima.
          </p>
        </div>

        <Link
          href="/admin/kategorije/nova"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-semibold text-brand-foreground"
        >
          <Plus width={16} height={16} aria-hidden />
          Nova kategorija
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-line">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-surface-raised text-left text-xs text-content-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Naziv</th>
              <th className="px-4 py-3 font-medium">Adresa</th>
              <th className="px-4 py-3 font-medium">Usluga</th>
              <th className="px-4 py-3 font-medium">Majstora</th>
              <th className="px-4 py-3 font-medium">Stanje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {kategorije.map((k) => {
              const brisanje = smeDaObriseKategoriju({
                brojMajstora: k.brojMajstora,
                brojUsluga: k.brojUsluga,
              });

              return (
                <tr key={k.id} className="bg-surface-card">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/kategorije/${k.id}`}
                      className="font-medium text-content-primary hover:text-brand"
                    >
                      {k.naziv}
                    </Link>
                    {/* Brisanje je izuzetak, pa se i najavljuje samo tamo gde je moguće. */}
                    {brisanje.sme ? (
                      <span className="ml-2 text-xs text-content-muted">(prazna)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-content-secondary">/{k.slug}</td>
                  <td className="px-4 py-3 tabular-nums text-content-secondary">{k.brojUsluga}</td>
                  <td className="px-4 py-3 tabular-nums text-content-secondary">
                    {k.brojMajstora}
                  </td>
                  <td className="px-4 py-3">
                    {k.isActive ? (
                      <span className="text-success">U ponudi</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-content-muted">
                        <EyeOff width={13} height={13} aria-hidden />
                        Ugašena
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";

import { adminRepository } from "@/modules/admin/repository";
import { obrisiKategorijuAction } from "@/modules/admin/actions";
import {
  PORUKE_ZABRANE_BRISANJA,
  smeDaObriseKategoriju,
} from "@/modules/admin/domain/pravila";
import { AdminForma } from "../../_ui/poruka-akcije";
import { FormaKategorije } from "../_ui/forma-kategorije";
import { UslugeKategorije } from "../_ui/usluge-kategorije";

export const metadata = { title: "Izmena kategorije" };

export default async function IzmenaKategorijePage({
  params,
}: PageProps<"/admin/kategorije/[id]">) {
  const { id } = await params;
  const kategorija = await adminRepository.nadjiKategoriju(id);
  if (!kategorija) notFound();

  const brisanje = smeDaObriseKategoriju({
    brojMajstora: kategorija._count.majstori,
    brojUsluga: kategorija._count.serviceTypes,
  });

  return (
    <div className="page-container py-8">
      <Link
        href="/admin/kategorije"
        className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
      >
        <ChevronLeft width={16} height={16} aria-hidden />
        Kategorije
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-content-primary">{kategorija.nameLatn}</h1>
      <p className="mt-1 text-sm text-content-secondary">
        /{kategorija.slug} · {kategorija._count.majstori} majstora ·{" "}
        {kategorija._count.serviceTypes} usluga
      </p>

      <div className="mt-6">
        <FormaKategorije
          vrednosti={{
            id: kategorija.id,
            slug: kategorija.slug,
            nameLatn: kategorija.nameLatn,
            nameCyrl: kategorija.nameCyrl,
            nameSingularLatn: kategorija.nameSingularLatn,
            nameSingularCyrl: kategorija.nameSingularCyrl,
            icon: kategorija.icon,
            introLatn: kategorija.introLatn,
            introCyrl: kategorija.introCyrl,
            seoTitle: kategorija.seoTitle ?? "",
            seoDescription: kategorija.seoDescription ?? "",
            sortOrder: kategorija.sortOrder,
            isActive: kategorija.isActive,
          }}
        />
      </div>

      <hr className="my-10 border-line" />

      <UslugeKategorije
        categoryId={kategorija.id}
        usluge={kategorija.serviceTypes.map((u) => ({
          id: u.id,
          slug: u.slug,
          nameLatn: u.nameLatn,
          nameCyrl: u.nameCyrl,
          defaultUnit: u.defaultUnit,
          allowedUnits: u.allowedUnits,
          sortOrder: u.sortOrder,
          isActive: u.isActive,
          brojMajstora: u._count.majstorServices,
        }))}
      />

      <hr className="my-10 border-line" />

      {/*
        Brisanje stoji na dnu, odvojeno, i postoji samo kad je zaista moguće.
        Dugme koje uvek odbije radnju uči čoveka da ignoriše poruke.
      */}
      <section>
        <h2 className="text-sm font-medium text-content-primary">Brisanje kategorije</h2>

        {brisanje.sme ? (
          <AdminForma
            akcija={obrisiKategorijuAction}
            className="mt-3"
            potvrda={`Obrisati kategoriju „${kategorija.nameLatn}"? Ovo se ne može poništiti.`}
          >
            <input type="hidden" name="id" value={kategorija.id} />
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-danger/50 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 width={15} height={15} aria-hidden />
              Obriši kategoriju
            </button>
          </AdminForma>
        ) : (
          <p className="mt-2 max-w-xl text-xs text-content-muted">
            {PORUKE_ZABRANE_BRISANJA[brisanje.razlog]}
          </p>
        )}
      </section>
    </div>
  );
}

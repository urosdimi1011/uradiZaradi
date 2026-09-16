import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { FormaKategorije } from "../_ui/forma-kategorije";

export const metadata = { title: "Nova kategorija" };

export default function NovaKategorijaPage() {
  return (
    <div className="page-container py-8">
      <Link
        href="/admin/kategorije"
        className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content-primary"
      >
        <ChevronLeft width={16} height={16} aria-hidden />
        Kategorije
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-content-primary">Nova kategorija</h1>
      <p className="mt-1 max-w-2xl text-sm text-content-secondary">
        Adresa se postavlja sada i posle se ne menja — zato je izaberite kako će stajati i za godinu
        dana.
      </p>

      <div className="mt-6">
        <FormaKategorije
          vrednosti={{
            slug: "",
            nameLatn: "",
            nameCyrl: "",
            nameSingularLatn: "",
            nameSingularCyrl: "",
            icon: "",
            introLatn: "",
            introCyrl: "",
            seoTitle: "",
            seoDescription: "",
            sortOrder: 0,
            isActive: true,
          }}
        />
      </div>
    </div>
  );
}

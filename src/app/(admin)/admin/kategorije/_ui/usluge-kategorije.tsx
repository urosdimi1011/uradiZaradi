import { Plus, Trash2 } from "lucide-react";

import { PRICE_UNIT_LABEL, type PriceUnit } from "@/modules/catalog/domain";
import { obrisiUsluguAction, sacuvajUsluguAction } from "@/modules/admin/actions";
import { smeDaObriseUslugu } from "@/modules/admin/domain/pravila";
import { AdminForma } from "../../_ui/poruka-akcije";

const SVE_JEDINICE = Object.keys(PRICE_UNIT_LABEL) as PriceUnit[];

export type UslugaRed = {
  id: string;
  slug: string;
  nameLatn: string;
  nameCyrl: string;
  defaultUnit: PriceUnit;
  allowedUnits: PriceUnit[];
  sortOrder: number;
  isActive: boolean;
  brojMajstora: number;
};

/**
 * Usluge unutar kategorije.
 *
 * Svaka usluga je svoja forma, ne jedan veliki formular sa svim uslugama:
 * pad na jednoj tada ne ruši izmene na ostalima, a poruka o grešci stoji uz
 * red na koji se odnosi.
 */
export function UslugeKategorije({
  categoryId,
  usluge,
}: {
  categoryId: string;
  usluge: UslugaRed[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-content-primary">Usluge</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Majstor bira iz ove liste i za svaku stavlja svoju cenu. Merna jedinica pripada usluzi —
        moler farba po m², ali montira karnišu po komadu.
      </p>

      <div className="mt-5 space-y-3">
        {usluge.map((u) => (
          <RedUsluge key={u.id} usluga={u} categoryId={categoryId} />
        ))}

        {usluge.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-dashed border-line px-4 py-6 text-center text-sm text-content-muted">
            Nijedna usluga još nije dodata.
          </p>
        ) : null}
      </div>

      <details className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface-card">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-content-primary">
          <Plus width={15} height={15} aria-hidden className="mr-1.5 inline align--2" />
          Dodaj uslugu
        </summary>
        <div className="border-t border-line px-4 py-4">
          <PoljaUsluge categoryId={categoryId} />
        </div>
      </details>
    </section>
  );
}

function RedUsluge({ usluga, categoryId }: { usluga: UslugaRed; categoryId: string }) {
  const brisanje = smeDaObriseUslugu({ brojMajstora: usluga.brojMajstora });

  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-surface-card">
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
        <span className="font-medium text-content-primary">{usluga.nameLatn}</span>
        <span className="font-mono text-xs text-content-muted">/{usluga.slug}</span>
        <span className="text-xs text-content-secondary">
          {PRICE_UNIT_LABEL[usluga.defaultUnit].latn}
        </span>
        <span className="ml-auto text-xs text-content-muted">
          {usluga.brojMajstora} u cenovniku
        </span>
        {!usluga.isActive ? <span className="text-xs text-content-muted">· ugašena</span> : null}
      </summary>

      <div className="border-t border-line px-4 py-4">
        <PoljaUsluge categoryId={categoryId} usluga={usluga} />

        <div className="mt-4 border-t border-line pt-4">
          {brisanje.sme ? (
            <AdminForma
              akcija={obrisiUsluguAction}
              potvrda={`Obrisati uslugu „${usluga.nameLatn}"?`}
            >
              <input type="hidden" name="id" value={usluga.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-danger hover:underline"
              >
                <Trash2 width={13} height={13} aria-hidden />
                Obriši uslugu
              </button>
            </AdminForma>
          ) : (
            <p className="text-xs text-content-muted">
              {usluga.brojMajstora} majstora ima ovu uslugu u cenovniku — ugasite je umesto
              brisanja, da im cene ostanu.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function PoljaUsluge({ categoryId, usluga }: { categoryId: string; usluga?: UslugaRed }) {
  const postoji = Boolean(usluga);

  return (
    <AdminForma akcija={sacuvajUsluguAction}>
      {postoji ? <input type="hidden" name="id" value={usluga!.id} /> : null}
      <input type="hidden" name="categoryId" value={categoryId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Malo
          ime="slug"
          naslov="Adresa"
          vrednost={usluga?.slug ?? ""}
          zakljucano={postoji}
          obavezno
        />
        <Malo
          ime="sortOrder"
          naslov="Redosled"
          vrednost={String(usluga?.sortOrder ?? 0)}
          tip="number"
        />
        <Malo ime="nameLatn" naslov="Naziv (lat)" vrednost={usluga?.nameLatn ?? ""} obavezno />
        <Malo ime="nameCyrl" naslov="Naziv (ćir)" vrednost={usluga?.nameCyrl ?? ""} obavezno />
      </div>

      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-medium text-content-secondary">
          Dozvoljene jedinice
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SVE_JEDINICE.map((j) => (
            <label key={j} className="flex items-center gap-1.5 text-xs text-content-primary">
              <input
                type="checkbox"
                name="allowedUnits"
                value={j}
                defaultChecked={usluga ? usluga.allowedUnits.includes(j) : j === "SAT"}
              />
              {PRICE_UNIT_LABEL[j].latn}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-medium text-content-secondary">
          Podrazumevana jedinica
        </span>
        <select
          name="defaultUnit"
          defaultValue={usluga?.defaultUnit ?? "SAT"}
          className="rounded-[var(--radius-control)] border border-line bg-surface-input px-3 py-2 text-sm text-content-primary"
        >
          {SVE_JEDINICE.map((j) => (
            <option key={j} value={j}>
              {PRICE_UNIT_LABEL[j].latn}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-content-muted">
          Mora biti među dozvoljenima — inače majstor dobije izbor koji ne može da sačuva.
        </span>
      </label>

      <label className="mt-3 flex items-center gap-2 text-xs text-content-primary">
        <input type="checkbox" name="isActive" value="1" defaultChecked={usluga?.isActive ?? true} />
        U ponudi
      </label>

      <button
        type="submit"
        className="mt-4 inline-flex h-9 items-center rounded-[var(--radius-control)] bg-brand px-4 text-xs font-semibold text-brand-foreground"
      >
        {postoji ? "Sačuvaj" : "Dodaj uslugu"}
      </button>
    </AdminForma>
  );
}

function Malo({
  ime,
  naslov,
  vrednost,
  tip = "text",
  obavezno,
  zakljucano,
}: {
  ime: string;
  naslov: string;
  vrednost: string;
  tip?: "text" | "number";
  obavezno?: boolean;
  zakljucano?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-content-secondary">{naslov}</span>
      <input
        type={tip}
        name={zakljucano ? undefined : ime}
        defaultValue={vrednost}
        required={obavezno && !zakljucano}
        disabled={zakljucano}
        className="w-full rounded-[var(--radius-control)] border border-line bg-surface-input px-3 py-2 text-sm text-content-primary disabled:text-content-muted"
      />
    </label>
  );
}

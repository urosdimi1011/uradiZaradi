"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField, greskaKlasa } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/field";
import { nativneProvere } from "@/components/ui/native-validity";
import { sacuvajKorak1Action, type KorakStanje } from "@/modules/majstori/actions";
import { NAJVISE_DODATNIH_ZANATA, PATTERNS, PORUKE } from "@/modules/majstori/domain/wizard";
import { cn } from "@/lib/cn";

export type IzborniPodaci = {
  kategorije: { id: string; naziv: string }[];
  gradovi: { id: string; naziv: string; delovi: { id: string; naziv: string }[] }[];
};

/**
 * Korak 1 — zanat, lokacija i telefon.
 *
 * Šalje se POST-om kroz Server Action: telefon i ime idu u telu zahteva, ne u
 * adresi. Stara mock forma je bila obična `<form>` bez `method`, pa je sve
 * završavalo u query stringu — a odatle u istoriji pretraživača, logovima i
 * `Referer` zaglavlju.
 *
 * Delovi grada se filtriraju u pretraživaču, bez odlaska na server: spisak je
 * mali (39 zapisa u četiri grada), pa nema razloga za mrežni poziv pri svakoj
 * promeni grada.
 */
export function Korak1Form({
  podaci,
  pocetno,
  pocetneDodatne,
  izmena,
}: {
  podaci: IzborniPodaci;
  /** Vrednosti već upisanog profila — čarobnjak služi i za izmenu. */
  pocetno: Partial<Record<"displayName" | "phone" | "primaryCategoryId" | "cityId" | "municipalityId", string>>;
  /** Već izabrani dodatni zanati. */
  pocetneDodatne: string[];
  /** Objavljen profil se menja, ne popunjava — menja se natpis i odredište. */
  izmena: boolean;
}) {
  const [state, formAction, pending] = useActionState<KorakStanje, FormData>(
    sacuvajKorak1Action,
    {},
  );

  /* Posle neuspeha vredi ono što je korisnik poslao, pa tek onda zatečeno. */
  const v = (polje: string) => state.values?.[polje] ?? pocetno[polje as keyof typeof pocetno] ?? "";
  const g = (polje: string) => state.fieldErrors?.[polje];

  const [gradId, setGradId] = useState(v("cityId"));
  const [glavni, setGlavni] = useState(v("primaryCategoryId"));
  const [dodatni, setDodatni] = useState<Set<string>>(() => new Set(pocetneDodatne));
  const delovi = podaci.gradovi.find((grad) => grad.id === gradId)?.delovi ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-danger/45 bg-danger/10 p-3 text-sm text-content-primary"
        >
          <AlertCircle width={16} height={16} aria-hidden className="shrink-0" />
          {state.error}
        </p>
      ) : null}

      <FormField
        label="Ime ili naziv radnje"
        hint="Ovako ćete biti prikazani u pretrazi."
        error={g("displayName")}
        required
      >
        {(props) => (
          <Input
            {...props}
            {...nativneProvere(PORUKE.ime)}
            name="displayName"
            defaultValue={v("displayName")}
            minLength={2}
            maxLength={60}
            pattern={PATTERNS.ime}
            autoComplete="name"
            placeholder="Petar Petrović"
            className={greskaKlasa(g("displayName"))}
          />
        )}
      </FormField>

      <FormField
        label="Broj telefona"
        hint="Ne prikazuje se javno dok posetilac ne klikne „Prikaži broj”."
        error={g("phone")}
        required
      >
        {(props) => (
          <Input
            {...props}
            {...nativneProvere(PORUKE.telefon)}
            type="tel"
            name="phone"
            defaultValue={v("phone")}
            pattern={PATTERNS.telefon}
            autoComplete="tel"
            inputMode="tel"
            placeholder="064 123 4567"
            className={greskaKlasa(g("phone"))}
          />
        )}
      </FormField>

      <FormField
        label="Glavni zanat"
        hint="Piše na vašoj kartici i ulazi u adresu profila, pa se kasnije ne menja u adresi."
        error={g("primaryCategoryId")}
        required
      >
        {(props) => (
          <Select
            {...props}
            {...nativneProvere(PORUKE.kategorija)}
            name="primaryCategoryId"
            value={glavni}
            onChange={(event) => setGlavni(event.currentTarget.value)}
            className={greskaKlasa(g("primaryCategoryId"))}
          >
            <option value="">Izaberite zanat</option>
            {podaci.kategorije.map((kategorija) => (
              <option key={kategorija.id} value={kategorija.id}>
                {kategorija.naziv}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      {/*
        Dodatni zanati. Moler koji ne gletuje je izuzetak, pa je ovo pravilo a
        ne izuzetak — majstor se pojavljuje u listingu SVAKOG izabranog zanata.

        Glavni se iz spiska izbacuje umesto da se onemogući: onemogućena kućica
        izgleda kao nešto što je zabranjeno, a ovde je prosto već izabrano.
      */}
      <fieldset className="border-0 p-0">
        <legend className="mb-1.5 text-sm font-medium text-content-primary">
          Radim i ovo
          <span className="ml-1.5 font-normal text-content-muted">(nije obavezno)</span>
        </legend>
        <p className="mb-2.5 text-xs leading-relaxed text-content-muted">
          Pojavljujete se u pretrazi za svaki izabrani zanat. Najviše {NAJVISE_DODATNIH_ZANATA}.
        </p>

        <div className="flex flex-wrap gap-2">
          {podaci.kategorije
            .filter((kategorija) => kategorija.id !== glavni)
            .map((kategorija) => {
              const cekiran = dodatni.has(kategorija.id);
              /* Preko granice se nove kućice gase, ali se već izabrane skidaju. */
              const puno = !cekiran && dodatni.size >= NAJVISE_DODATNIH_ZANATA;

              return (
                <label
                  key={kategorija.id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm transition-colors",
                    cekiran
                      ? "border-brand/50 bg-brand/10 text-content-primary"
                      : "border-line bg-surface-input text-content-secondary hover:border-line-strong",
                    puno && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    name="dodatneKategorije"
                    value={kategorija.id}
                    checked={cekiran}
                    disabled={puno}
                    /*
                      Vrednost se čita ODMAH, van `setDodatni`. React posle
                      povratka iz rukovaoca očisti događaj, a funkciju za
                      izmenu stanja može pozvati kasnije — tada je
                      `event.currentTarget` već `null` i komponenta pukne.
                    */
                    onChange={(event) => {
                      const cekirano = event.currentTarget.checked;
                      setDodatni((prethodni) => {
                        const novi = new Set(prethodni);
                        if (cekirano) novi.add(kategorija.id);
                        else novi.delete(kategorija.id);
                        return novi;
                      });
                    }}
                    className="h-4 w-4 accent-[var(--color-brand)]"
                  />
                  {kategorija.naziv}
                </label>
              );
            })}
        </div>

        {g("dodatneKategorije") ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle width={14} height={14} aria-hidden className="shrink-0" />
            {g("dodatneKategorije")}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Grad" error={g("cityId")} required>
          {(props) => (
            <Select
              {...props}
              {...nativneProvere(PORUKE.grad)}
              name="cityId"
              value={gradId}
              onChange={(event) => setGradId(event.currentTarget.value)}
              className={greskaKlasa(g("cityId"))}
            >
              <option value="">Izaberite grad</option>
              {podaci.gradovi.map((grad) => (
                <option key={grad.id} value={grad.id}>
                  {grad.naziv}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        {/*
          Deo grada postoji samo u četiri grada. Umesto da se polje sakriva —
          što pomera raspored pri svakoj promeni grada — ostaje na mestu i
          onemogući se, sa objašnjenjem zašto.
        */}
        <FormField
          label="Deo grada"
          error={g("municipalityId")}
          hint={
            gradId && delovi.length === 0 ? "Za izabrani grad ne vodimo delove grada." : undefined
          }
        >
          {(props) => (
            <Select
              {...props}
              name="municipalityId"
              defaultValue={v("municipalityId")}
              disabled={delovi.length === 0}
              className={greskaKlasa(g("municipalityId"))}
            >
              <option value="">{gradId ? "Ceo grad" : "Prvo izaberite grad"}</option>
              {delovi.map((deo) => (
                <option key={deo.id} value={deo.id}>
                  {deo.naziv}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending} fullWidth className="h-12 sm:w-48">
          {pending ? (
            <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
          ) : (
            izmena ? "Sačuvaj izmene" : "Sačuvaj i nastavi"
          )}
        </Button>
      </div>
    </form>
  );
}

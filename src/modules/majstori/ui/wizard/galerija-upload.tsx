"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";

import { OGRANICENJA } from "@/lib/storage/tip";
import { obrisiFotografijuAction, otpremiSlikuAction } from "@/modules/majstori/actions";
import { proveriIzabranFajl, smanjiFotografiju } from "./slika-utils";

export type Fotografija = { id: string; url: string };

/**
 * Fotografije radova.
 *
 * Za razliku od avatara, ove se NE seku — odnos stranica se ostavlja kakav
 * jeste. Kupac gleda kupatilo, ne kompoziciju; kvadratni isečak bi samo odsekao
 * pola posla koji majstor pokazuje.
 *
 * Smanjivanje ipak ide, u pretraživaču: telefon pravi fotografiju od 8 MB, a
 * šalje se oko 200 KB.
 */
export function GalerijaUpload({ pocetne }: { pocetne: Fotografija[] }) {
  const [fotografije, setFotografije] = useState(pocetne);
  const [greska, setGreska] = useState<string | null>(null);
  const [otprema, setOtprema] = useState(false);
  const [brise, pokreniBrisanje] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const preostalo = OGRANICENJA.najviseFotografija - fotografije.length;

  async function dodaj(event: React.ChangeEvent<HTMLInputElement>) {
    const izabrani = [...(event.currentTarget.files ?? [])];
    if (izabrani.length === 0) return;

    setGreska(null);
    setOtprema(true);

    try {
      /*
       * Redom, ne odjednom. Deset paralelnih otpremanja na mobilnom internetu
       * uspori svako od njih i lakše pukne; redom je sporije na papiru a
       * pouzdanije u praksi.
       */
      for (const fajl of izabrani.slice(0, preostalo)) {
        const problem = proveriIzabranFajl(fajl);
        if (problem) {
          setGreska(problem);
          continue;
        }

        const izvor = URL.createObjectURL(fajl);
        try {
          const blob = await smanjiFotografiju(izvor);
          const podaci = new FormData();
          podaci.append("slika", new File([blob], "rad.jpg", { type: "image/jpeg" }));
          podaci.append("vrsta", "rad");

          const odgovor = await otpremiSlikuAction(podaci);
          if (odgovor.error) {
            setGreska(odgovor.error);
            break;
          }
          /* Id dolazi sa servera — po njemu brisanje pronalazi red u bazi. */
          if (odgovor.url && odgovor.id) {
            setFotografije((prethodne) => [...prethodne, { id: odgovor.id!, url: odgovor.url! }]);
          }
        } finally {
          URL.revokeObjectURL(izvor);
        }
      }

      if (izabrani.length > preostalo) {
        setGreska(`Dodato je prvih ${preostalo}; više od ${OGRANICENJA.najviseFotografija} nije moguće.`);
      }
    } finally {
      setOtprema(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function obrisi(id: string) {
    pokreniBrisanje(async () => {
      await obrisiFotografijuAction(id);
      setFotografije((prethodne) => prethodne.filter((f) => f.id !== id));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {fotografije.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotografije.map((fotografija) => (
            <li
              key={fotografija.id}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-hover"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- slika iz skladišta, bez poznatih dimenzija */}
              <img src={fotografija.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => obrisi(fotografija.id)}
                disabled={brise}
                aria-label="Obriši fotografiju"
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-[var(--radius-pill)] bg-black/60 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 width={14} height={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {greska ? (
        <p className="flex items-start gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle width={14} height={14} aria-hidden className="mt-px shrink-0" />
          {greska}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={dodaj}
          disabled={otprema || preostalo <= 0}
          className="text-xs text-content-secondary file:mr-3 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-surface-input file:px-3 file:py-2 file:text-xs file:text-content-primary"
          aria-label="Dodajte fotografije radova"
        />
        {otprema ? (
          <span className="flex items-center gap-1.5 text-xs text-content-muted">
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
            Otprema u toku…
          </span>
        ) : (
          <span className="text-xs text-content-muted">
            {preostalo > 0 ? `Još ${preostalo} mesta` : "Dostignut je maksimum"}
          </span>
        )}
      </div>
    </div>
  );
}

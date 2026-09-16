import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Stepper } from "./stepper";
import type { KorakSegment } from "@/modules/majstori/domain/wizard";

/**
 * Zaglavlje koraka — naslov, objašnjenje i traka koraka.
 *
 * Isti ekrani služe i za prvo popunjavanje i za kasniju izmenu, pa zaglavlje
 * mora da kaže u kom je od ta dva režima čovek. Bez toga bi majstor koji je
 * došao da promeni telefon video „Registrujte se kao majstor" i pomislio da
 * pravi nov nalog.
 *
 * Dva odvojena ekrana bi to rešila lepše na prvi pogled, ali bi značila dva
 * mesta za svako polje — a ona se raziđu prvom izmenom.
 */
export function WizardHeader({
  izmena,
  naslov,
  opis,
  trenutni,
  zavrseni,
}: {
  izmena: boolean;
  naslov: string;
  opis: string;
  trenutni: KorakSegment;
  zavrseni: readonly KorakSegment[];
}) {
  return (
    <>
      {/*
        Povratak na nalog stoji SAMO pri izmeni. U prvom popunjavanju bi bio
        izlaz iz posla koji je čovek tek započeo, i ponudio bi mu da odustane
        pre nego što je i video o čemu se radi.
      */}
      {izmena ? (
        <Link
          href="/nalog"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-content-secondary transition-colors hover:text-content-primary"
        >
          <ArrowLeft width={15} height={15} aria-hidden />
          Nazad na nalog
        </Link>
      ) : null}

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content-primary">{naslov}</h1>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">{opis}</p>
      </header>

      <div className="mb-8">
        <Stepper trenutni={trenutni} zavrseni={[...zavrseni]} />
      </div>
    </>
  );
}

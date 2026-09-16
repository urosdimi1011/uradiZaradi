import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Hammer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { StanjeProfila } from "@/modules/users/routing";

/**
 * Traka o stanju majstorskog profila.
 *
 * Stoji iznad zaglavlja i vidi se na svakoj stranici dok profil nije objavljen.
 * Namerno se NE može zatvoriti: majstor koji je zaboravio da dovrši profil ne
 * dobija nijedan poziv, a nema odakle da sazna zašto. Nestaje sama onog
 * trenutka kad profil pređe u `ACTIVE`.
 *
 * Nije zalepljena za vrh (`sticky`) — zaglavlje jeste. Traka odskroluje i
 * prestaje da smeta čim korisnik krene da čita, a vrati se na vrhu stranice.
 *
 * ── Ponašanje po širinama ──
 *
 * Na telefonu je puna rečenica trošila 101px, osminu ekrana, na SVAKOJ stranici.
 * Zato se menjaju tri stvari odjednom:
 *   • ikonica se skriva ispod `sm` — ukras, a jede 28px širine koje trebaju tekstu
 *   • tekst ima kratku varijantu — „Profil nije objavljen." umesto cele rečenice
 *   • dugme ostaje u ISTOM redu (`shrink-0`), ne pada ispod
 *
 * Tekst se prebacuje na `md` (768px), ne na `sm` (640px): izmereno, puna rečenica
 * staje u jedan red tek od 768 naviše. Da je prelom na `sm`, između 640 i 767
 * bi se uključila duga varijanta koja se odmah lomi u dva reda — najgore od oba.
 *
 * Jedan DOM, prekidanje čisto kroz CSS — isto kao kod kartica majstora. Dve
 * odvojene komponente za mobilni i desktop bi značile dva mesta za svaku izmenu
 * teksta, a obe bi bile u HTML-u svejedno.
 */
export function ProfileBanner({ stanje }: { stanje: StanjeProfila | null }) {
  const poruka = tekst(stanje);
  if (!poruka) return null;

  const { icon: Icon, naslov, kratko, akcija, kratkaAkcija, href, ton } = poruka;
  const upozorenje = ton === "upozorenje";

  return (
    <div className={upozorenje ? "border-b border-brand/40 bg-brand/10" : "border-b border-line bg-surface-raised"}>
      <div className="page-container flex min-h-11 items-center gap-2 py-2 sm:gap-3">
        <Icon
          width={16}
          height={16}
          aria-hidden
          className={`hidden shrink-0 sm:block ${upozorenje ? "text-brand" : "text-content-muted"}`}
        />

        {/*
          `min-w-0` je obavezno: bez njega flex stavka ne sme da se suzi ispod
          širine svog sadržaja, pa bi duga rečenica gurala dugme van ekrana.
        */}
        <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-content-primary md:text-sm">
          <span className="md:hidden">{kratko}</span>
          <span className="hidden md:inline">{naslov}</span>
        </p>

        {href && akcija ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-medium text-brand hover:underline md:text-sm"
          >
            <span className="md:hidden">{kratkaAkcija ?? akcija}</span>
            <span className="hidden md:inline">{akcija}</span>
            <ArrowRight width={14} height={14} aria-hidden className="shrink-0" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export type Poruka = {
  icon: LucideIcon;
  /** Puna rečenica — od `md` (768px) naviše. */
  naslov: string;
  /** Skraćena varijanta ispod 768px; mora da stane u jedan red na 320px. */
  kratko: string;
  akcija?: string;
  kratkaAkcija?: string;
  href?: string;
  ton: "upozorenje" | "obavestenje";
};

/*
 * Objavljen profil ne dobija traku — tada je sve u redu i nema šta da se javi.
 * Svako drugo stanje majstor mora da zna, uključujući i „skinut", jer bi inače
 * mislio da je živ a niko ga ne zove.
 */
export function tekst(stanje: StanjeProfila | null): Poruka | null {
  if (!stanje || stanje.vrsta === "objavljen") return null;

  switch (stanje.vrsta) {
    case "nije-zapocet":
      return {
        icon: Hammer,
        naslov: "Još niste popunili svoj majstorski profil — bez njega vas niko ne može pronaći.",
        kratko: "Profil još nije popunjen.",
        akcija: "Popunite profil",
        kratkaAkcija: "Popuni",
        href: "/registracija-majstora",
        ton: "upozorenje",
      };
    case "u-izradi":
      return {
        icon: AlertTriangle,
        naslov: "Vaš profil još nije objavljen i ne prikazuje se u pretrazi.",
        kratko: "Profil nije objavljen.",
        akcija: "Nastavite popunjavanje",
        kratkaAkcija: "Nastavi",
        href: "/registracija-majstora",
        ton: "upozorenje",
      };
    case "u-pregledu":
      return {
        icon: Clock,
        naslov: "Vaš profil je poslat na pregled. Javićemo vam čim bude objavljen.",
        kratko: "Profil je na pregledu.",
        ton: "obavestenje",
      };
    case "skinut":
      return {
        /* Bez linka dok ne postoji stranica za podršku — radije bez akcije nego u 404. */
        icon: AlertTriangle,
        naslov: "Vaš profil je trenutno skinut sa sajta i ne prikazuje se u pretrazi.",
        kratko: "Profil je skinut sa sajta.",
        ton: "obavestenje",
      };
  }
}

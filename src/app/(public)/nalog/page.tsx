import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Camera, Eye, Hammer, Images, Mail, MapPin, Phone, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { majstorRepository } from "@/modules/majstori/repository";
import { prikaziTelefon } from "@/modules/majstori/domain/telefon";
import { signOutAction } from "@/modules/users/actions";
import { getCurrentUser } from "@/lib/session";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";

export const metadata: Metadata = {
  title: "Moj nalog",
  robots: { index: false, follow: false },
};

/**
 * Nalog — pregled i ulaz u izmene.
 *
 * Izmene NE dobijaju svoj poseban ekran. Vode na iste korake kroz koje je
 * profil i popunjen: dva odvojena editora značila bi dva mesta za svako polje,
 * i ona bi se razišla prvom izmenom. Korak zna da li je profil nacrt ili
 * objavljen, pa se prema tome i ponaša — nacrt vodi dalje, objavljen se vraća
 * ovamo.
 *
 * Zaštita je ovde, na serveru: ko upiše `/nalog` bez sesije, vraća se na
 * prijavu pre nego što se ijedan podatak pročita iz baze.
 */
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/prijava");

  const script = await getScript();
  const profil = user.role === "MAJSTOR" ? await majstorRepository.findWizardProfile(user.id) : null;

  const [sveKategorije, grad, deo] = await Promise.all([
    profil ? catalogRepository.listCategories() : [],
    profil ? geoRepository.findCityById(profil.cityId) : null,
    profil?.municipalityId ? geoRepository.findMunicipalityById(profil.municipalityId) : null,
  ]);

  /*
   * Statistika BEZ praga — ovo je majstorov nalog, ne javni profil. Njemu je
   * „3 pregleda" korisna informacija; posetiocu bi ista brojka radila protiv
   * majstora, pa se javno prikazuje tek iznad praga.
   */
  const statistika = profil ? await majstorRepository.findStats(profil.id) : null;

  /* Glavni zanat prvi, ostali za njim — isti redosled kao svuda u domenu. */
  const zanati = profil
    ? [
        profil.primaryCategoryId,
        ...profil.categories
          .map((veza) => veza.categoryId)
          .filter((id) => id !== profil.primaryCategoryId),
      ]
        .map((id) => sveKategorije.find((k) => k.id === id))
        .filter((k) => k !== undefined)
        .map((k) => pick(k.nameSingular, script))
    : [];

  return (
    <div className="page-container py-8 lg:py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold text-content-primary">Moj nalog</h1>
          <p className="mt-2 text-sm text-content-secondary">
            {profil
              ? "Ovde menjate sve što posetilac vidi na vašem profilu."
              : "Podaci vašeg naloga."}
          </p>
        </header>

        <Odeljak naslov="Nalog">
          <Red icon={User} naziv="Ime" vrednost={user.displayName} />
          <Red icon={Mail} naziv="E-pošta" vrednost={user.email} />
          <Red
            icon={profil ? Hammer : User}
            naziv="Tip naloga"
            vrednost={user.role === "MAJSTOR" ? "Majstor" : "Naručilac posla"}
          />
        </Odeljak>

        {profil ? (
          <>
            <Odeljak
              naslov="Zanat, lokacija i telefon"
              izmeni="/registracija-majstora/zanat"
            >
              <Red icon={User} naziv="Prikazano ime" vrednost={profil.displayName} />
              <Red
                icon={Briefcase}
                naziv={zanati.length > 1 ? "Zanati" : "Zanat"}
                vrednost={zanati.join(", ")}
              />
              <Red
                icon={MapPin}
                naziv="Lokacija"
                vrednost={[grad ? pick(grad.name, script) : null, deo ? pick(deo.name, script) : null]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Red icon={Phone} naziv="Telefon" vrednost={prikaziTelefon(profil.phone)} />
            </Odeljak>

            {profil.status === "ACTIVE" ? (
              <Odeljak naslov="Statistika profila">
                <Red
                  icon={Eye}
                  naziv="Pregleda profila"
                  vrednost={String(statistika?.profileViews ?? 0)}
                />
                <Red
                  icon={Phone}
                  naziv="Puta je uzet broj"
                  vrednost={String(statistika?.phoneReveals ?? 0)}
                />
              </Odeljak>
            ) : null}

            <Odeljak naslov="Usluge i cene" izmeni="/registracija-majstora/usluge">
              <Red
                icon={Briefcase}
                naziv="Izabrane usluge"
                vrednost={`${profil.services.length} ${profil.services.length === 1 ? "usluga" : "usluga"}`}
              />
            </Odeljak>

            <Odeljak naslov="Profil i fotografije" izmeni="/registracija-majstora/profil">
              <Red
                icon={Camera}
                naziv="Profilna fotografija"
                vrednost={profil.avatarUrl ? "Postavljena" : "Nije postavljena"}
              />
              <Red
                icon={Images}
                naziv="Fotografije radova"
                vrednost={
                  profil.gallery.length > 0
                    ? `${profil.gallery.length} od 12`
                    : "Nema ni jedne — profili sa slikama dobijaju više poziva"
                }
              />
              <Red
                icon={User}
                naziv="Opis"
                vrednost={`${profil.bio.trim().length} znakova`}
              />
            </Odeljak>

            {/*
              Link na javni profil postoji samo kad je objavljen — nacrt na toj
              adresi daje 404, pa bi dugme vodilo u zid.
            */}
            {profil.status === "ACTIVE" ? (
              <Link
                href={`/majstor/${profil.slug}`}
                className="inline-flex h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] border border-line-strong px-5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
              >
                <Eye width={16} height={16} aria-hidden />
                Pogledaj svoj javni profil
              </Link>
            ) : (
              <Link
                href="/registracija-majstora"
                className="inline-flex h-11 w-fit items-center rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-brand-foreground"
              >
                Nastavite popunjavanje profila
              </Link>
            )}
          </>
        ) : user.role !== "MAJSTOR" ? (
          <Odeljak naslov="Radite neki zanat?">
            <p className="px-4 py-3 text-sm leading-relaxed text-content-secondary">
              Napravite majstorski profil i pojavite se u pretrazi kod ljudi kojima treba vaš zanat.
            </p>
            <div className="px-4 pb-4">
              <Link
                href="/registracija-majstora"
                className="inline-flex h-11 items-center rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-brand-foreground"
              >
                Postanite majstor
              </Link>
            </div>
          </Odeljak>
        ) : null}

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-line-strong px-5 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
          >
            Odjavi se
          </button>
        </form>
      </div>
    </div>
  );
}

function Odeljak({
  naslov,
  izmeni,
  children,
}: {
  naslov: string;
  /** Adresa koraka koji menja ove podatke; izostavljeno znači da se ne menjaju. */
  izmeni?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-content-primary">{naslov}</h2>
        {izmeni ? (
          <Link href={izmeni} className="text-sm font-medium text-brand hover:underline">
            Izmeni
          </Link>
        ) : null}
      </div>

      <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface-card">
        {children}
      </dl>
    </section>
  );
}

function Red({ icon: Icon, naziv, vrednost }: { icon: LucideIcon; naziv: string; vrednost: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon width={16} height={16} aria-hidden className="shrink-0 text-content-muted" />
      <dt className="w-36 shrink-0 text-sm text-content-secondary">{naziv}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm text-content-primary">{vrednost || "—"}</dd>
    </div>
  );
}

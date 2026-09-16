import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";

import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { majstorRepository } from "@/modules/majstori/repository";
import { OPIS_NAJMANJE } from "@/modules/majstori/domain/wizard";
import { prikaziTelefon } from "@/modules/majstori/domain/telefon";
import { ObjavaForm } from "@/modules/majstori/ui/wizard/objava-form";
import { Stepper } from "@/modules/majstori/ui/wizard/stepper";
import { requireUser } from "@/lib/session";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";

/**
 * Korak 4 — pregled i objava.
 *
 * Pregled pokazuje šta je popunjeno a šta ne, sa linkom na korak koji fali.
 * „Nešto nedostaje" bez pokazivanja šta znači da majstor mora sam da pogađa.
 */
export default async function ObjavaPage() {
  const user = await requireUser();
  const script = await getScript();

  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) redirect("/registracija-majstora/zanat");

  const [kategorija, grad] = await Promise.all([
    catalogRepository.findCategoryById(profil.primaryCategoryId),
    geoRepository.findCityById(profil.cityId),
  ]);

  const stavke = [
    { naziv: "Zanat i lokacija", ok: true, opis: `${kategorija ? pick(kategorija.nameSingular, script) : "—"}, ${grad ? pick(grad.name, script) : "—"}`, korak: "zanat" },
    { naziv: "Telefon", ok: true, opis: prikaziTelefon(profil.phone), korak: "zanat" },
    { naziv: "Usluge", ok: profil.services.length > 0, opis: `${profil.services.length} izabranih`, korak: "usluge" },
    { naziv: "Opis", ok: profil.bio.trim().length >= OPIS_NAJMANJE, opis: profil.bio.trim().length >= OPIS_NAJMANJE ? `${profil.bio.trim().length} znakova` : "prekratak ili nije popunjen", korak: "profil" },
    { naziv: "Profilna fotografija", ok: Boolean(profil.avatarUrl), opis: profil.avatarUrl ? "postavljena" : "nije obavezna, ali donosi više poziva", korak: "profil", neobavezno: true },
    { naziv: "Fotografije radova", ok: profil.gallery.length > 0, opis: profil.gallery.length > 0 ? `${profil.gallery.length} fotografija` : "nije obavezno", korak: "profil", neobavezno: true },
  ];

  const spreman = stavke.every((stavka) => stavka.ok || stavka.neobavezno);
  const vecObjavljen = profil.status === "ACTIVE";

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-content-primary">
          {vecObjavljen ? "Profil je objavljen" : "Pregled pre objave"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          {vecObjavljen
            ? "Vaš profil je vidljiv u pretrazi. Izmene možete raditi kroz korake iznad."
            : "Proverite podatke. Posle objave profil se odmah pojavljuje u pretrazi."}
        </p>
      </header>

      <div className="mb-8">
        <Stepper trenutni="objava" zavrseni={["zanat", "usluge", "profil"]} />
      </div>

      <ul className="mb-8 divide-y divide-line rounded-[var(--radius-card)] border border-line">
        {stavke.map((stavka) => (
          <li key={stavka.naziv} className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden
              className={
                stavka.ok
                  ? "grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-brand/15 text-brand"
                  : "grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-surface-hover text-content-muted"
              }
            >
              {stavka.ok ? <Check width={13} height={13} /> : <X width={13} height={13} />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-content-primary">{stavka.naziv}</p>
              <p className="truncate text-xs text-content-muted">{stavka.opis}</p>
            </div>

            <a
              href={`/registracija-majstora/${stavka.korak}`}
              className="shrink-0 text-xs font-medium text-brand hover:underline"
            >
              Izmeni
            </a>
          </li>
        ))}
      </ul>

      {vecObjavljen ? (
        <a
          href={`/majstor/${profil.slug}`}
          className="inline-flex h-12 items-center justify-center rounded-[var(--radius-control)] bg-brand px-6 text-sm font-semibold text-brand-foreground"
        >
          Pogledaj svoj profil
        </a>
      ) : (
        <ObjavaForm spreman={spreman} />
      )}
    </>
  );
}

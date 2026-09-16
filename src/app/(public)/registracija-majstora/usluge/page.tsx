import { redirect } from "next/navigation";

import { catalogRepository } from "@/modules/catalog/repository";
import { PRICE_UNIT_LABEL } from "@/modules/catalog/domain";
import { majstorRepository } from "@/modules/majstori/repository";
import { cenaZaUnos } from "@/modules/majstori/domain/cena";
import { Korak2Form, type PonudjenaUsluga } from "@/modules/majstori/ui/wizard/korak2-form";
import { WizardHeader } from "@/modules/majstori/ui/wizard/wizard-header";
import { requireUser } from "@/lib/session";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";

/**
 * Korak 2 — usluge i cene.
 *
 * Ponuda zavisi od zanata izabranog na koraku 1, pa ovaj korak bez njega nema
 * šta da prikaže. Zato preusmerava umesto da prikaže praznu listu.
 */
export default async function UslugePage() {
  const user = await requireUser();
  const script = await getScript();

  const profil = await majstorRepository.findWizardProfile(user.id);
  if (!profil) redirect("/registracija-majstora/zanat");

  /*
   * Usluge iz SVIH zanata koje majstor radi, ne samo iz glavnog. Majstor koji
   * je uz molerstvo dodao keramiku mora ovde da vidi i jedno i drugo — inače
   * dodatni zanat postoji u profilu a nema ni jednu uslugu, pa ga nijedan
   * filter ne nalazi.
   */
  const sviZanati = profil.categories.map((veza) => veza.categoryId);

  const [kategorija, tipovi, sveKategorije] = await Promise.all([
    catalogRepository.findCategoryById(profil.primaryCategoryId),
    catalogRepository.listServiceTypesForCategories(
      sviZanati.length > 0 ? sviZanati : [profil.primaryCategoryId],
    ),
    catalogRepository.listCategories(),
  ]);

  const nazivKategorije = new Map(
    sveKategorije.map((k) => [k.id, pick(k.nameSingular, script)]),
  );

  /* Već upisane cene i jedinice, da izmena ne kreće od nule. */
  const izmena = profil.status === "ACTIVE";

  const vec = new Map(profil.services.map((s) => [s.serviceTypeId, s]));

  const usluge: PonudjenaUsluga[] = tipovi.map((tip) => {
    const upisana = vec.get(tip.id);
    return {
      id: tip.id,
      naziv: pick(tip.name, script),
      jedinice: tip.allowedUnits.map((jedinica) => ({
        vrednost: jedinica,
        naziv: pick(PRICE_UNIT_LABEL[jedinica], script),
      })),
      podrazumevanaJedinica: tip.defaultUnit,
      izabrana: Boolean(upisana),
      cena: cenaZaUnos(upisana?.priceFromMinor),
      jedinica: upisana?.unit ?? tip.defaultUnit,
      /* Naslov grupe — prikazuje se samo kad majstor ima više zanata. */
      zanat: nazivKategorije.get(tip.categoryId) ?? "",
    };
  });

  return (
    <>
      <WizardHeader
        izmena={izmena}
        naslov="Usluge i cene"
        opis={`Izaberite šta radite kao ${kategorija ? pick(kategorija.nameSingular, script).toLowerCase() : "majstor"}. Cene se prikazuju kao „od” i po njima vas ljudi porede sa drugima.`}
        trenutni="usluge"
        zavrseni={
          izmena
            ? ["zanat", "usluge", "profil", "objava"]
            : ["zanat", ...(profil.services.length > 0 ? (["usluge"] as const) : [])]
        }
      />

      <Korak2Form usluge={usluge} izmena={profil.status === "ACTIVE"} />
    </>
  );
}

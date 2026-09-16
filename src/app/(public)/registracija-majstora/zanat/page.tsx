import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { majstorRepository } from "@/modules/majstori/repository";
import { Korak1Form, type IzborniPodaci } from "@/modules/majstori/ui/wizard/korak1-form";
import { WizardHeader } from "@/modules/majstori/ui/wizard/wizard-header";
import { prikaziTelefon } from "@/modules/majstori/domain/telefon";
import { requireUser } from "@/lib/session";
import { t as pick } from "@/lib/script";
import { getScript } from "@/lib/script.server";

/**
 * Korak 1 — zanat, lokacija i telefon.
 *
 * Jedini korak koji kreira profil. Namerno je kratak: što pre red postoji u
 * bazi, to manje ima šta da se izgubi kad neko zatvori karticu.
 *
 * Telefon je baš ovde zato što je `@unique`. Ako je broj zauzet, čovek to mora
 * da sazna pre nego što uloži dvadeset minuta u opis i fotografije.
 */
export default async function ZanatPage() {
  const user = await requireUser();
  const script = await getScript();

  const [kategorije, gradovi, profil] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
    majstorRepository.findWizardProfile(user.id),
  ]);

  /*
   * Delovi grada za SVE gradove odjednom, pa se biraju u pretraživaču.
   * Zapisa je 39 — jeftinije je poslati ih sve nego ići na server pri svakoj
   * promeni grada.
   */
  const delovi = await Promise.all(
    gradovi.map(async (grad) => ({
      gradId: grad.id,
      lista: await geoRepository.listMunicipalities(grad.slug),
    })),
  );
  const deloviPoGradu = new Map(delovi.map((stavka) => [stavka.gradId, stavka.lista]));

  const podaci: IzborniPodaci = {
    kategorije: kategorije.map((kategorija) => ({
      id: kategorija.id,
      naziv: pick(kategorija.nameSingular, script),
    })),
    gradovi: gradovi.map((grad) => ({
      id: grad.id,
      naziv: pick(grad.name, script),
      delovi: (deloviPoGradu.get(grad.id) ?? []).map((deo) => ({
        id: deo.id,
        naziv: pick(deo.name, script),
      })),
    })),
  };

  const izmena = profil?.status === "ACTIVE";

  return (
    <>
      <WizardHeader
        izmena={izmena}
        naslov={izmena ? "Zanat, lokacija i telefon" : "Registrujte se kao majstor"}
        opis={
          izmena
            ? "Izmene se odmah vide na vašem profilu i u pretrazi."
            : "Popunite profil i pojavite se u pretrazi kod ljudi kojima treba vaš zanat. Svaki korak se čuva posebno — možete prekinuti i nastaviti kasnije."
        }
        trenutni="zanat"
        zavrseni={izmena ? ["zanat", "usluge", "profil", "objava"] : profil ? ["zanat"] : []}
      />

      <Korak1Form
        izmena={izmena}
        podaci={podaci}
        /* Glavni zanat se izbacuje — on ima svoj izbor iznad kućica. */
        pocetneDodatne={(profil?.categories ?? [])
          .map((veza) => veza.categoryId)
          .filter((id) => id !== profil?.primaryCategoryId)}
        pocetno={{
          /* Ime naloga kao predlog — majstor sme da upiše naziv radnje umesto njega. */
          displayName: profil?.displayName ?? user.displayName,
          /* U bazi stoji `+381641234567`; čoveku se pokazuje `064 123 4567`. */
          phone: profil?.phone ? prikaziTelefon(profil.phone) : "",
          primaryCategoryId: profil?.primaryCategoryId ?? "",
          cityId: profil?.cityId ?? "",
          municipalityId: profil?.municipalityId ?? "",
        }}
      />
    </>
  );
}

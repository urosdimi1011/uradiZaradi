import { sacuvajKategorijuAction } from "@/modules/admin/actions";
import { AdminForma } from "../../_ui/poruka-akcije";
import { Polje, Prekidac } from "../../_ui/polja";

export type VrednostiKategorije = {
  id?: string;
  slug: string;
  nameLatn: string;
  nameCyrl: string;
  nameSingularLatn: string;
  nameSingularCyrl: string;
  icon: string;
  introLatn: string;
  introCyrl: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Forma kategorije — ista i za novu i za izmenu.
 *
 * Razlika je jedna: slug se kod postojeće kategorije prikazuje, ali se ne šalje
 * i ne može da se menja. To je adresa koju Google već ima i koja stoji u svakom
 * linku ka toj kategoriji.
 */
export function FormaKategorije({ vrednosti }: { vrednosti: VrednostiKategorije }) {
  const postoji = Boolean(vrednosti.id);

  return (
    <AdminForma akcija={sacuvajKategorijuAction} className="max-w-2xl">
      {postoji ? <input type="hidden" name="id" value={vrednosti.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Polje
          ime="slug"
          naslov="Adresa"
          podrazumevano={vrednosti.slug}
          zakljucano={postoji}
          nagovestaj={
            postoji
              ? "Adresa se ne menja — na njoj stoje indeksirane stranice."
              : "Mala slova i crtice. Postaje /moleri i /moleri/beograd."
          }
          obavezno
        />
        <Polje
          ime="icon"
          naslov="Ikona (lucide)"
          podrazumevano={vrednosti.icon}
          nagovestaj="Naziv iz lucide-react seta, npr. Paintbrush."
          obavezno
        />

        <Polje ime="nameLatn" naslov="Naziv (množina, lat)" podrazumevano={vrednosti.nameLatn} obavezno />
        <Polje ime="nameCyrl" naslov="Naziv (množina, ćir)" podrazumevano={vrednosti.nameCyrl} obavezno />

        <Polje
          ime="nameSingularLatn"
          naslov="Jednina (lat)"
          podrazumevano={vrednosti.nameSingularLatn}
          nagovestaj="Za naslov profila — Moler, Novi Sad."
          obavezno
        />
        <Polje
          ime="nameSingularCyrl"
          naslov="Jednina (ćir)"
          podrazumevano={vrednosti.nameSingularCyrl}
          obavezno
        />
      </div>

      <div className="mt-4 grid gap-4">
        <Polje
          ime="introLatn"
          naslov="Uvodni tekst (lat)"
          podrazumevano={vrednosti.introLatn}
          viseredno
          nagovestaj="Bar 80 znakova. Ovo je jedino što stranicu kategorije deli od prazne liste."
          obavezno
        />
        <Polje
          ime="introCyrl"
          naslov="Uvodni tekst (ćir)"
          podrazumevano={vrednosti.introCyrl}
          viseredno
          obavezno
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Polje ime="seoTitle" naslov="SEO naslov" podrazumevano={vrednosti.seoTitle} />
        <Polje ime="seoDescription" naslov="SEO opis" podrazumevano={vrednosti.seoDescription} />
        <Polje
          ime="sortOrder"
          naslov="Redosled"
          tip="number"
          podrazumevano={String(vrednosti.sortOrder)}
          nagovestaj="Manji broj ide ranije u traci zanata."
        />
      </div>

      <Prekidac
        ime="isActive"
        naslov="U ponudi"
        opis="Ugašena kategorija ostaje na svojoj adresi, ali se ne nudi novim majstorima."
        podrazumevano={vrednosti.isActive}
      />

      <button
        type="submit"
        className="mt-5 inline-flex h-10 items-center rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-brand-foreground"
      >
        {postoji ? "Sačuvaj izmene" : "Napravi kategoriju"}
      </button>
    </AdminForma>
  );
}

/**
 * Gradovi i delovi grada — referentni podaci.
 *
 * Ovo NISU demo podaci. Demo majstori, korisnici i recenzije se generišu i brišu
 * pri svakom `db:seed`; gradovi ostaju, jer su stvarni i jer na njih pokazuju
 * profili pravih majstora. Zato stoje ovde, u kodu, a ne u `src/data/*.json`
 * koji generator prepisuje.
 *
 * ── Šta je „deo grada" ──
 *
 * Polje `Municipality` u šemi znači **deo grada onako kako ga ljudi zovu**, a ne
 * administrativnu jedinicu. Kupac kaže „treba mi vodoinstalater na Limanu", ne
 * „u gradskoj opštini Novi Sad". Zato:
 *
 *   • Beograd, Niš, Kragujevac → gradske opštine (i jesu ono što ljudi kažu)
 *   • Novi Sad → kvartovi (Liman, Detelinara…), jer gradskih opština nema
 *   • manji gradovi → prazno; tamo je grad dovoljno mali da deo nije ni bitan
 *
 * Delovi se navode SAMO gde postoji ustaljena lista. Izmišljanje kvartova za
 * četrdeset gradova dalo bi podatke koje lokalni čovek ne prepoznaje, a filter
 * po njima bi vraćao prazno — gore nego da ih nema. Dodavanje je kasnije jedan
 * red u ovoj listi.
 *
 * ── Tačnost polja ──
 *
 * `lokativ` ide DIREKTNO u naslov indeksirane stranice („Moleri u Beogradu —
 * cene i recenzije"), pa je jedino polje gde greška odmah ide u Google. Zato je
 * pisan ručno za svaki grad; pravilo ga ne pogađa („Šabac" → „Šapcu").
 *
 * `stanovnika` je zaokružen popis iz 2022. i koristi se samo za redosled u
 * navigaciji i prioritet u sitemapu — nigde se ne prikazuje kao broj.
 *
 * `lat`/`lng` su centri gradova na dve decimale. Zasad ih ništa ne prikazuje;
 * stoje jer ih šema traži i jer će trebati za mapu i `geo` u JSON-LD.
 *
 * Ćirilica se ne upisuje ručno — seed je izvodi kroz `toCyrillic()`, istu
 * funkciju koju koristi ostatak sajta. Gde transliteracija omaši, postoji polje
 * `cyrl` za ručnu ispravku.
 */

export type DeoGrada = {
  slug: string;
  latn: string;
  /** Ručna ispravka ćirilice; izostavljeno znači „izvedi transliteracijom". */
  cyrl?: string;
};

export type Grad = {
  slug: string;
  latn: string;
  cyrl?: string;
  /** Bez predloga: „Beogradu", ne „u Beogradu" — predlog dodaje pozivalac. */
  lokativ: string;
  /** Upravni okrug; prikazuje se uz grad kad ime nije jednoznačno. */
  okrug: string;
  stanovnika: number;
  lat: number;
  lng: number;
  delovi: DeoGrada[];
};

const d = (slug: string, latn: string, cyrl?: string): DeoGrada => ({ slug, latn, cyrl });

export const GRADOVI: Grad[] = [
  {
    slug: "beograd",
    latn: "Beograd",
    lokativ: "Beogradu",
    okrug: "Grad Beograd",
    stanovnika: 1197000,
    lat: 44.79,
    lng: 20.45,
    /* 17 gradskih opština — zvanična lista i ujedno ono što Beograđani kažu. */
    delovi: [
      d("stari-grad", "Stari grad"),
      d("vracar", "Vračar"),
      d("savski-venac", "Savski venac"),
      d("novi-beograd", "Novi Beograd"),
      d("zemun", "Zemun"),
      d("vozdovac", "Voždovac"),
      d("zvezdara", "Zvezdara"),
      d("palilula", "Palilula"),
      d("rakovica", "Rakovica"),
      d("cukarica", "Čukarica"),
      d("surcin", "Surčin"),
      d("grocka", "Grocka"),
      d("obrenovac", "Obrenovac"),
      d("lazarevac", "Lazarevac"),
      d("mladenovac", "Mladenovac"),
      d("barajevo", "Barajevo"),
      d("sopot", "Sopot"),
    ],
  },
  {
    slug: "novi-sad",
    latn: "Novi Sad",
    lokativ: "Novom Sadu",
    okrug: "Južnobački okrug",
    stanovnika: 306000,
    lat: 45.27,
    lng: 19.83,
    /* Novi Sad nema gradske opštine osim Petrovaradina — ovo su kvartovi. */
    delovi: [
      d("liman", "Liman"),
      d("grbavica", "Grbavica"),
      d("detelinara", "Detelinara"),
      d("novo-naselje", "Novo naselje"),
      d("telep", "Telep"),
      d("podbara", "Podbara"),
      d("salajka", "Salajka"),
      d("adice", "Adice"),
      d("veternik", "Veternik"),
      d("futog", "Futog"),
      d("petrovaradin", "Petrovaradin"),
      d("sremska-kamenica", "Sremska Kamenica"),
    ],
  },
  {
    slug: "nis",
    latn: "Niš",
    lokativ: "Nišu",
    okrug: "Nišavski okrug",
    stanovnika: 183000,
    lat: 43.32,
    lng: 21.9,
    /* Slug „palilula" postoji i u Beogradu — šema ga traži jedinstvenim samo
       u okviru grada (`@@unique([cityId, slug])`), pa se ne preimenuje. */
    delovi: [
      d("medijana", "Medijana"),
      d("palilula", "Palilula"),
      d("pantelej", "Pantelej"),
      d("crveni-krst", "Crveni krst"),
      d("niska-banja", "Niška Banja"),
    ],
  },
  {
    slug: "kragujevac",
    latn: "Kragujevac",
    lokativ: "Kragujevcu",
    okrug: "Šumadijski okrug",
    stanovnika: 150000,
    lat: 44.01,
    lng: 20.92,
    delovi: [
      d("aerodrom", "Aerodrom"),
      d("pivara", "Pivara"),
      d("stanovo", "Stanovo"),
      d("stari-grad", "Stari grad"),
      d("strage", "Strage"),
    ],
  },
  { slug: "subotica", latn: "Subotica", lokativ: "Subotici", okrug: "Severnobački okrug", stanovnika: 94000, lat: 46.1, lng: 19.67, delovi: [] },
  { slug: "pancevo", latn: "Pančevo", lokativ: "Pančevu", okrug: "Južnobanatski okrug", stanovnika: 73000, lat: 44.87, lng: 20.64, delovi: [] },
  { slug: "cacak", latn: "Čačak", lokativ: "Čačku", okrug: "Moravički okrug", stanovnika: 71000, lat: 43.89, lng: 20.35, delovi: [] },
  { slug: "zrenjanin", latn: "Zrenjanin", lokativ: "Zrenjaninu", okrug: "Srednjobanatski okrug", stanovnika: 67000, lat: 45.38, lng: 20.39, delovi: [] },
  { slug: "novi-pazar", latn: "Novi Pazar", lokativ: "Novom Pazaru", okrug: "Raški okrug", stanovnika: 66000, lat: 43.14, lng: 20.51, delovi: [] },
  { slug: "kraljevo", latn: "Kraljevo", lokativ: "Kraljevu", okrug: "Raški okrug", stanovnika: 64000, lat: 43.72, lng: 20.69, delovi: [] },
  { slug: "smederevo", latn: "Smederevo", lokativ: "Smederevu", okrug: "Podunavski okrug", stanovnika: 62000, lat: 44.66, lng: 20.93, delovi: [] },
  { slug: "leskovac", latn: "Leskovac", lokativ: "Leskovcu", okrug: "Jablanički okrug", stanovnika: 60000, lat: 42.99, lng: 21.95, delovi: [] },
  { slug: "krusevac", latn: "Kruševac", lokativ: "Kruševcu", okrug: "Rasinski okrug", stanovnika: 57000, lat: 43.58, lng: 21.33, delovi: [] },
  { slug: "valjevo", latn: "Valjevo", lokativ: "Valjevu", okrug: "Kolubarski okrug", stanovnika: 56000, lat: 44.27, lng: 19.89, delovi: [] },
  { slug: "uzice", latn: "Užice", lokativ: "Užicu", okrug: "Zlatiborski okrug", stanovnika: 52000, lat: 43.86, lng: 19.84, delovi: [] },
  { slug: "vranje", latn: "Vranje", lokativ: "Vranju", okrug: "Pčinjski okrug", stanovnika: 51000, lat: 42.55, lng: 21.9, delovi: [] },
  { slug: "sabac", latn: "Šabac", lokativ: "Šapcu", okrug: "Mačvanski okrug", stanovnika: 49000, lat: 44.75, lng: 19.69, delovi: [] },
  { slug: "sombor", latn: "Sombor", lokativ: "Somboru", okrug: "Zapadnobački okrug", stanovnika: 42000, lat: 45.77, lng: 19.11, delovi: [] },
  { slug: "pozarevac", latn: "Požarevac", lokativ: "Požarevcu", okrug: "Braničevski okrug", stanovnika: 39000, lat: 44.62, lng: 21.19, delovi: [] },
  { slug: "sremska-mitrovica", latn: "Sremska Mitrovica", lokativ: "Sremskoj Mitrovici", okrug: "Sremski okrug", stanovnika: 36000, lat: 44.98, lng: 19.61, delovi: [] },
  { slug: "pirot", latn: "Pirot", lokativ: "Pirotu", okrug: "Pirotski okrug", stanovnika: 34000, lat: 43.15, lng: 22.59, delovi: [] },
  { slug: "jagodina", latn: "Jagodina", lokativ: "Jagodini", okrug: "Pomoravski okrug", stanovnika: 34000, lat: 43.98, lng: 21.26, delovi: [] },
  { slug: "kikinda", latn: "Kikinda", lokativ: "Kikindi", okrug: "Severnobanatski okrug", stanovnika: 33000, lat: 45.83, lng: 20.46, delovi: [] },
  { slug: "vrsac", latn: "Vršac", lokativ: "Vršcu", okrug: "Južnobanatski okrug", stanovnika: 33000, lat: 45.12, lng: 21.3, delovi: [] },
  { slug: "bor", latn: "Bor", lokativ: "Boru", okrug: "Borski okrug", stanovnika: 30000, lat: 44.07, lng: 22.1, delovi: [] },
  { slug: "zajecar", latn: "Zaječar", lokativ: "Zaječaru", okrug: "Zaječarski okrug", stanovnika: 29000, lat: 43.9, lng: 22.27, delovi: [] },
  { slug: "ruma", latn: "Ruma", lokativ: "Rumi", okrug: "Sremski okrug", stanovnika: 27000, lat: 45.01, lng: 19.82, delovi: [] },
  { slug: "backa-palanka", latn: "Bačka Palanka", lokativ: "Bačkoj Palanci", okrug: "Južnobački okrug", stanovnika: 26000, lat: 45.25, lng: 19.39, delovi: [] },
  { slug: "prokuplje", latn: "Prokuplje", lokativ: "Prokuplju", okrug: "Toplički okrug", stanovnika: 25000, lat: 43.23, lng: 21.59, delovi: [] },
  { slug: "indjija", latn: "Inđija", lokativ: "Inđiji", okrug: "Sremski okrug", stanovnika: 25000, lat: 45.05, lng: 20.08, delovi: [] },
  { slug: "paracin", latn: "Paraćin", lokativ: "Paraćinu", okrug: "Pomoravski okrug", stanovnika: 23000, lat: 43.86, lng: 21.41, delovi: [] },
  { slug: "arandjelovac", latn: "Aranđelovac", lokativ: "Aranđelovcu", okrug: "Šumadijski okrug", stanovnika: 22000, lat: 44.31, lng: 20.56, delovi: [] },
  { slug: "vrbas", latn: "Vrbas", lokativ: "Vrbasu", okrug: "Južnobački okrug", stanovnika: 22000, lat: 45.57, lng: 19.64, delovi: [] },
  { slug: "gornji-milanovac", latn: "Gornji Milanovac", lokativ: "Gornjem Milanovcu", okrug: "Moravički okrug", stanovnika: 20000, lat: 44.03, lng: 20.46, delovi: [] },
  { slug: "stara-pazova", latn: "Stara Pazova", lokativ: "Staroj Pazovi", okrug: "Sremski okrug", stanovnika: 20000, lat: 44.98, lng: 20.16, delovi: [] },
  { slug: "loznica", latn: "Loznica", lokativ: "Loznici", okrug: "Mačvanski okrug", stanovnika: 19000, lat: 44.53, lng: 19.22, delovi: [] },
  { slug: "cuprija", latn: "Ćuprija", lokativ: "Ćupriji", okrug: "Pomoravski okrug", stanovnika: 19000, lat: 43.93, lng: 21.37, delovi: [] },
  { slug: "becej", latn: "Bečej", lokativ: "Bečeju", okrug: "Južnobački okrug", stanovnika: 19000, lat: 45.62, lng: 20.04, delovi: [] },
  { slug: "negotin", latn: "Negotin", lokativ: "Negotinu", okrug: "Borski okrug", stanovnika: 15000, lat: 44.23, lng: 22.53, delovi: [] },
  { slug: "trstenik", latn: "Trstenik", lokativ: "Trsteniku", okrug: "Rasinski okrug", stanovnika: 14000, lat: 43.62, lng: 21.0, delovi: [] },
];

/** Svi delovi grada, spljošteni, sa slug-om grada kom pripadaju. */
export const DELOVI_GRADA = GRADOVI.flatMap((grad) =>
  grad.delovi.map((deo, i) => ({ ...deo, gradSlug: grad.slug, sortOrder: i + 1 })),
);

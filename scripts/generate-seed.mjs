/**
 * Generiše demo podatke u src/data/*.json.
 *
 * Pokretanje: npm run seed
 *
 * Podaci su izmišljeni i služe samo prikazu dizajna u Fazi 0.
 * Oblik JSON-a je identičan Zod šemama iz src/modules/*\/domain, pa se u Fazi 1
 * menja samo repository implementacija (JSON → Prisma), bez diranja UI-ja.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

/** Mora da odgovara `slugSchema` iz src/modules/shared/domain/primitives.ts. */
const slugify = (input) =>
  input
    .replace(/[đĐ]/g, "dj")
    .replace(/[žŽ]/g, "z")
    .replace(/[ćĆčČ]/g, "c")
    .replace(/[šŠ]/g, "s")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EUR = 117; // informativni kurs za konverziju iz mockupa (mockup je u €, model čuva RSD)
const rsd = (eur) => Math.round(eur * EUR) * 100; // u parama

const L = (latn, cyrl) => ({ latn, cyrl });

// ─────────────────────────────── Geografija ───────────────────────────────

const cities = [
  // [slug, nominativ, LOKATIV, okrug, lat, lng, stanovnika]
  ["beograd", L("Beograd", "Београд"), L("Beogradu", "Београду"), L("Grad Beograd", "Град Београд"), 44.7866, 20.4489, 1_197_000],
  ["novi-sad", L("Novi Sad", "Нови Сад"), L("Novom Sadu", "Новом Саду"), L("Južnobački okrug", "Јужнобачки округ"), 45.2671, 19.8335, 306_000],
  ["nis", L("Niš", "Ниш"), L("Nišu", "Нишу"), L("Nišavski okrug", "Нишавски округ"), 43.3209, 21.8958, 260_000],
  ["kragujevac", L("Kragujevac", "Крагујевац"), L("Kragujevcu", "Крагујевцу"), L("Šumadijski okrug", "Шумадијски округ"), 44.0128, 20.9114, 179_000],
  ["subotica", L("Subotica", "Суботица"), L("Subotici", "Суботици"), L("Severnobački okrug", "Севернобачки округ"), 46.1000, 19.6650, 123_000],
  ["cacak", L("Čačak", "Чачак"), L("Čačku", "Чачку"), L("Moravički okrug", "Моравички округ"), 43.8914, 20.3497, 115_000],
].map(([slug, name, nameLocative, region, lat, lng, population], i) => ({
  id: `city_${i + 1}`, slug, name, nameLocative, region, lat, lng, population,
}));

const municipalityData = {
  beograd: [
    ["zvezdara", L("Zvezdara", "Звездара")],
    ["novi-beograd", L("Novi Beograd", "Нови Београд")],
    ["vracar", L("Vračar", "Врачар")],
    ["palilula", L("Palilula", "Палилула")],
    ["cukarica", L("Čukarica", "Чукарица")],
    ["zemun", L("Zemun", "Земун")],
    ["vozdovac", L("Voždovac", "Вождовац")],
    ["stari-grad", L("Stari grad", "Стари град")],
    ["rakovica", L("Rakovica", "Раковица")],
  ],
  "novi-sad": [
    ["liman", L("Liman", "Лиман")],
    ["detelinara", L("Detelinara", "Детелинара")],
    ["petrovaradin", L("Petrovaradin", "Петроварадин")],
  ],
  nis: [
    ["medijana", L("Medijana", "Медијана")],
    ["palilula-nis", L("Palilula", "Палилула")],
  ],
  kragujevac: [["aerodrom", L("Aerodrom", "Аеродром")]],
  subotica: [["centar", L("Centar", "Центар")]],
  cacak: [["centar-cacak", L("Centar", "Центар")]],
};

let mIdx = 0;
const municipalities = Object.entries(municipalityData).flatMap(([citySlug, list]) =>
  list.map(([slug, name]) => ({ id: `muni_${++mIdx}`, citySlug, slug, name })),
);

// ─────────────────────────────── Katalog ───────────────────────────────

const categoryData = [
  {
    slug: "moleri", icon: "PaintRoller",
    name: L("Moleri", "Молери"), nameSingular: L("Moler", "Молер"),
    intro: L(
      "Molerski radovi obuhvataju sve od pripreme i gletovanja zidova do finalnog farbanja i dekorativnih tehnika. Cena se najčešće obračunava po kvadratnom metru obrađene površine, a razlikuje se prema stanju zida i broju slojeva.",
      "Молерски радови обухватају све од припреме и глетовања зидова до финалног фарбања и декоративних техника. Цена се најчешће обрачунава по квадратном метру обрађене површине, а разликује се према стању зида и броју слојева.",
    ),
    seo: {
      title: "Moleri — cene i majstori po gradovima",
      description: "Pronađite proverenog molera. Uporedite cene krečenja, gletovanja i farbanja po m² i pročitajte recenzije stvarnih korisnika.",
    },
    services: [
      ["belenje-zidova", L("Beljenje zidova", "Бељење зидова"), "M2"],
      ["farbanje-zidova", L("Farbanje zidova", "Фарбање зидова"), "M2"],
      ["gletovanje", L("Gletovanje", "Глетовање")   , "M2"],
      ["dekorativne-tehnike", L("Dekorativne tehnike", "Декоративне технике"), "PO_DOGOVORU"],
      ["priprema-zidova", L("Priprema zidova", "Припрема зидова"), "M2"],
      ["farbanje-stolarije", L("Farbanje stolarije", "Фарбање столарије"), "M2"],
    ],
  },
  {
    slug: "elektricari", icon: "Zap",
    name: L("Električari", "Електричари"), nameSingular: L("Električar", "Електричар"),
    intro: L(
      "Elektroinstalaterski radovi se naplaćuju po satu za intervencije ili po komadu za ugradnju elemenata. Kompletno opremanje stana obračunava se po kvadratu.",
      "Електроинсталатерски радови се наплаћују по сату за интервенције или по комаду за уградњу елемената. Комплетно опремање стана обрачунава се по квадрату.",
    ),
    seo: {
      title: "Električari — hitne intervencije i instalacije",
      description: "Verifikovani električari za popravke, zamenu instalacija i ugradnju rasvete. Cene po satu i po komadu, sa recenzijama.",
    },
    services: [
      ["popravka-kvara", L("Popravka kvara", "Поправка квара"), "SAT"],
      ["elektro-instalacije", L("Elektroinstalacije u stanu", "Електроинсталације у стану"), "M2"],
      ["ugradnja-lustera", L("Ugradnja lustera", "Уградња лустера"), "KOMAD"],
      ["zamena-uticnice", L("Zamena utičnice ili prekidača", "Замена утичнице или прекидача"), "KOMAD"],
      ["zamena-osiguraca", L("Zamena osigurača", "Замена осигурача"), "KOMAD"],
    ],
  },
  {
    slug: "vodoinstalateri", icon: "Droplets",
    name: L("Vodoinstalateri", "Водоинсталатери"), nameSingular: L("Vodoinstalater", "Водоинсталатер"),
    intro: L(
      "Vodoinstalaterske usluge pokrivaju hitna odgušenja, zamenu cevi i ugradnju sanitarija. Intervencije se plaćaju po satu, ugradnja uređaja po komadu, a razvod instalacija po dužnom metru.",
      "Водоинсталатерске услуге покривају хитна одгушења, замену цеви и уградњу санитарија. Интервенције се плаћају по сату, уградња уређаја по комаду, а развод инсталација по дужном метру.",
    ),
    seo: {
      title: "Vodoinstalateri — odgušenja, cevi i sanitarije",
      description: "Pozovite vodoinstalatera za hitno odgušenje ili zamenu bojlera. Uporedite cene po satu i po komadu.",
    },
    services: [
      ["odgusenje-odvoda", L("Odgušenje odvoda", "Одгушење одвода"), "SAT"],
      ["zamena-bojlera", L("Zamena bojlera", "Замена бојлера"), "KOMAD"],
      ["ugradnja-sanitarija", L("Ugradnja sanitarija", "Уградња санитарија"), "KOMAD"],
      ["zamena-cevi", L("Zamena vodovodnih cevi", "Замена водоводних цеви"), "M1"],
      ["popravka-slavine", L("Popravka slavine", "Поправка славине"), "KOMAD"],
    ],
  },
  {
    slug: "keramicari", icon: "Grid2x2",
    name: L("Keramičari", "Керамичари"), nameSingular: L("Keramičar", "Керамичар"),
    intro: L(
      "Postavljanje pločica se obračunava po kvadratnom metru, a cena zavisi od formata pločice, podloge i složenosti sečenja. Rušenje stare keramike se naplaćuje odvojeno.",
      "Постављање плочица се обрачунава по квадратном метру, а цена зависи од формата плочице, подлоге и сложености сечења. Рушење старе керамике се наплаћује одвојено.",
    ),
    seo: {
      title: "Keramičari — cena postavljanja pločica po m²",
      description: "Majstori za keramiku i granitnu keramiku. Uporedite cenu po m², pogledajte fotografije radova i recenzije.",
    },
    services: [
      ["postavljanje-plocica", L("Postavljanje pločica", "Постављање плочица"), "M2"],
      ["granitna-keramika", L("Granitna keramika", "Гранитна керамика"), "M2"],
      ["fugovanje", L("Fugovanje", "Фуговање"), "M2"],
      ["rusenje-plocica", L("Rušenje stare keramike", "Рушење старе керамике"), "M2"],
    ],
  },
  {
    slug: "stolari", icon: "Hammer",
    name: L("Stolari", "Столари"), nameSingular: L("Stolar", "Столар"),
    intro: L(
      "Nameštaj po meri se ugovara po projektu, dok se montaža gotovog nameštaja i popravke naplaćuju po satu ili po komadu.",
      "Намештај по мери се уговара по пројекту, док се монтажа готовог намештаја и поправке наплаћују по сату или по комаду.",
    ),
    seo: {
      title: "Stolari — nameštaj po meri i montaža",
      description: "Stolari za kuhinje, plakare i montažu nameštaja. Pogledajte radove i zatražite procenu.",
    },
    services: [
      ["kuhinja-po-meri", L("Kuhinja po meri", "Кухиња по мери"), "PO_DOGOVORU"],
      ["plakar-po-meri", L("Plakar po meri", "Плакар по мери"), "M2"],
      ["montaza-namestaja", L("Montaža nameštaja", "Монтажа намештаја"), "SAT"],
      ["popravka-vrata", L("Popravka vrata", "Поправка врата"), "KOMAD"],
    ],
  },
  {
    slug: "klima-uredjaji", icon: "Wind",
    name: L("Klima uređaji", "Клима уређаји"), nameSingular: L("Klima majstor", "Клима мајстор"),
    intro: L(
      "Ugradnja i servis klima uređaja naplaćuju se po uređaju. Cena ugradnje zavisi od dužine instalacije i potrebe za bušenjem fasade.",
      "Уградња и сервис клима уређаја наплаћују се по уређају. Цена уградње зависи од дужине инсталације и потребе за бушењем фасаде.",
    ),
    seo: {
      title: "Ugradnja i servis klima uređaja",
      description: "Majstori za klima uređaje: ugradnja, servis i dopuna freona. Cene po uređaju.",
    },
    services: [
      ["ugradnja-klime", L("Ugradnja klima uređaja", "Уградња клима уређаја"), "KOMAD"],
      ["servis-klime", L("Servis i čišćenje klime", "Сервис и чишћење климе"), "KOMAD"],
      ["dopuna-freona", L("Dopuna freona", "Допуна фреона"), "KOMAD"],
      ["demontaza-klime", L("Demontaža klime", "Демонтажа климе"), "KOMAD"],
    ],
  },
  {
    slug: "gradjevinski-radovi", icon: "HardHat",
    name: L("Građevinski radovi", "Грађевински радови"), nameSingular: L("Građevinac", "Грађевинац"),
    intro: L(
      "Grubi građevinski radovi se ugovaraju po kvadratu izvedene površine ili po dnevnici ekipe, u zavisnosti od obima posla.",
      "Груби грађевински радови се уговарају по квадрату изведене површине или по дневници екипе, у зависности од обима посла.",
    ),
    seo: {
      title: "Građevinski radovi — zidanje, malterisanje, adaptacije",
      description: "Ekipe za grube građevinske radove i adaptacije. Cene po m² i po dnevnici.",
    },
    services: [
      ["zidanje", L("Zidanje", "Зидање"), "M2"],
      ["malterisanje", L("Malterisanje", "Малтерисање"), "M2"],
      ["ab-radovi", L("Armirano-betonski radovi", "Армирано-бетонски радови"), "DAN"],
      ["rusenje-i-odvoz", L("Rušenje i odvoz šuta", "Рушење и одвоз шута"), "DAN"],
    ],
  },
  {
    slug: "bravari", icon: "KeyRound",
    name: L("Bravari", "Бравари"), nameSingular: L("Bravar", "Бравар"),
    intro: L(
      "Bravarske usluge uključuju hitno otvaranje vrata, zamenu brava i izradu ograda. Hitne intervencije se naplaćuju po izlasku, izrada po dužnom metru.",
      "Браварске услуге укључују хитно отварање врата, замену брава и израду ограда. Хитне интервенције се наплаћују по изласку, израда по дужном метру.",
    ),
    seo: {
      title: "Bravari — hitno otvaranje vrata i zamena brava",
      description: "Bravari dostupni za hitne intervencije. Zamena brava, izrada ograda i gelendera.",
    },
    services: [
      ["hitno-otvaranje", L("Hitno otvaranje vrata", "Хитно отварање врата"), "KOMAD"],
      ["zamena-brave", L("Zamena brave", "Замена браве"), "KOMAD"],
      ["izrada-ograde", L("Izrada ograde", "Израда ограде"), "M1"],
    ],
  },
  {
    slug: "parketari", icon: "Layers",
    name: L("Parketari", "Паркетари"), nameSingular: L("Parketar", "Паркетар"),
    intro: L(
      "Postavljanje i obrada parketa se obračunavaju po kvadratnom metru. Hoblovanje i lakiranje se često ugovaraju zajedno sa postavljanjem.",
      "Постављање и обрада паркета се обрачунавају по квадратном метру. Хобловање и лакирање се често уговарају заједно са постављањем.",
    ),
    seo: {
      title: "Parketari — postavljanje, hoblovanje i lakiranje",
      description: "Majstori za parket i laminat. Uporedite cene po m² i pogledajte fotografije radova.",
    },
    services: [
      ["postavljanje-parketa", L("Postavljanje parketa", "Постављање паркета"), "M2"],
      ["hoblovanje-lakiranje", L("Hoblovanje i lakiranje", "Хобловање и лакирање"), "M2"],
      ["postavljanje-laminata", L("Postavljanje laminata", "Постављање ламината"), "M2"],
    ],
  },
];

const UNIT_ALLOWED = {
  M2: ["M2", "PO_DOGOVORU"],
  M1: ["M1", "PO_DOGOVORU"],
  SAT: ["SAT", "PO_DOGOVORU"],
  DAN: ["DAN", "SAT", "PO_DOGOVORU"],
  KOMAD: ["KOMAD", "PO_DOGOVORU"],
  PO_DOGOVORU: ["PO_DOGOVORU", "M2", "SAT"],
};

const categories = categoryData.map((c, i) => ({
  id: `cat_${i + 1}`, slug: c.slug, name: c.name, nameSingular: c.nameSingular,
  icon: c.icon, intro: c.intro, seo: c.seo, sortOrder: i, isActive: true,
}));

const serviceTypes = [];
categoryData.forEach((c, ci) => {
  c.services.forEach(([slug, name, unit], si) => {
    serviceTypes.push({
      id: `svc_${ci + 1}_${si + 1}`, slug, categoryId: `cat_${ci + 1}`, name,
      defaultUnit: unit, allowedUnits: UNIT_ALLOWED[unit], sortOrder: si, isActive: true,
    });
  });
});

// ─────────────────────────────── Majstori ───────────────────────────────

const svcId = (slug) => serviceTypes.find((s) => s.slug === slug).id;
const cityId = (slug) => cities.find((c) => c.slug === slug).id;
const muniId = (slug) => municipalities.find((m) => m.slug === slug).id;

/**
 * Portreti: i.pravatar.cc, jer isporučuje 800×800.
 * randomuser.me daje samo 128×128, što je mutno na velikoj slici profila.
 * Sve su placeholder fotografije i menjaju se pravim slikama majstora.
 *
 * [ime, kategorija, grad, opština, ocena, brojRecenzija, godine, nivo, pravatarId, [usluga, €]]
 */
const majstorSpec = [
  ["Marko Petrović", "moleri", "beograd", "zvezdara", 4.9, 127, 12, "IDENTITY", { gender: "men", n: 32 },
    [["farbanje-zidova", 8], ["belenje-zidova", 6], ["gletovanje", 5], ["dekorativne-tehnike", null], ["priprema-zidova", 3], ["farbanje-stolarije", 9]]],
  ["Nikola Jovanović", "elektricari", "beograd", "novi-beograd", 4.8, 98, 9, "IDENTITY", { gender: "men", n: 44 },
    [["popravka-kvara", 20], ["elektro-instalacije", 14], ["ugradnja-lustera", 18], ["zamena-uticnice", 6]]],
  ["Petar Kostić", "vodoinstalateri", "beograd", "vracar", 4.7, 56, 15, "IDENTITY", { gender: "men", n: 51 },
    [["odgusenje-odvoda", 15], ["zamena-bojlera", 35], ["ugradnja-sanitarija", 40], ["popravka-slavine", 12]]],
  ["Aleksandar Mitić", "keramicari", "beograd", "palilula", 4.9, 74, 11, "IDENTITY", { gender: "men", n: 64 },
    [["postavljanje-plocica", 12], ["granitna-keramika", 15], ["fugovanje", 4], ["rusenje-plocica", 5]]],
  ["Milan Stojanović", "stolari", "beograd", "cukarica", 4.8, 45, 8, "IDENTITY", { gender: "men", n: 75 },
    [["kuhinja-po-meri", null], ["plakar-po-meri", 120], ["montaza-namestaja", 18], ["popravka-vrata", 25]]],
  ["Dejan Radović", "moleri", "beograd", "zemun", 4.6, 38, 6, "PHONE", { gender: "men", n: 83 },
    [["farbanje-zidova", 7], ["belenje-zidova", 5], ["gletovanje", 4]]],
  ["Ivan Đorđević", "klima-uredjaji", "beograd", "vozdovac", 4.7, 61, 10, "IDENTITY", { gender: "men", n: 12 },
    [["ugradnja-klime", 45], ["servis-klime", 25], ["dopuna-freona", 30], ["demontaza-klime", 20]]],
  ["Jelena Vasić", "moleri", "beograd", "stari-grad", 4.9, 41, 7, "IDENTITY", { gender: "women", n: 26 },
    [["dekorativne-tehnike", null], ["farbanje-zidova", 10], ["gletovanje", 6]]],
  ["Bojan Ilić", "bravari", "beograd", "rakovica", 4.9, 83, 14, "IDENTITY", { gender: "men", n: 22 },
    [["hitno-otvaranje", 30], ["zamena-brave", 22], ["izrada-ograde", 55]]],
  ["Stefan Nikolić", "gradjevinski-radovi", "novi-sad", "liman", 4.5, 29, 18, "PHONE", { gender: "men", n: 91 },
    [["zidanje", 16], ["malterisanje", 9], ["ab-radovi", 60], ["rusenje-i-odvoz", 50]]],
  ["Vladimir Simić", "vodoinstalateri", "novi-sad", "detelinara", 4.4, 18, 5, "PHONE", { gender: "men", n: 36 },
    [["odgusenje-odvoda", 13], ["zamena-bojlera", 30], ["popravka-slavine", 10]]],
  ["Nemanja Pavlović", "parketari", "nis", "medijana", 4.8, 52, 13, "IDENTITY", { gender: "men", n: 8 },
    [["postavljanje-parketa", 10], ["hoblovanje-lakiranje", 7], ["postavljanje-laminata", 6]]],
  ["Goran Antić", "elektricari", "kragujevac", "aerodrom", 4.6, 33, 20, "PHONE", { gender: "men", n: 55 },
    [["popravka-kvara", 17], ["zamena-uticnice", 5], ["zamena-osiguraca", 7]]],
  ["Miloš Tadić", "keramicari", "novi-sad", "petrovaradin", 4.7, 24, 6, "PHONE", { gender: "men", n: 68 },
    [["postavljanje-plocica", 11], ["fugovanje", 4]]],
  ["Ana Marković", "stolari", "beograd", "novi-beograd", 4.8, 31, 9, "IDENTITY", { gender: "women", n: 44 },
    [["plakar-po-meri", 110], ["montaza-namestaja", 16], ["kuhinja-po-meri", null]]],
];

/**
 * Portreti majstora.
 *
 * `LOCAL_PORTRAITS=1 npm run seed` prebacuje seed na `/majstori/<slug>.jpg` —
 * stavi svoje (ili AI generisane) fotografije u `public/majstori/` i pusti seed.
 * To je jedini način da demo ima lica koja izgledaju kao majstori; nijedan
 * besplatan servis nasumičnih portreta ne garantuje ton koji ti treba.
 *
 * Podrazumevano ide randomuser.me: uniformni headshotovi, bez naočara za sunce
 * i izvedenih poza kakve daje pravatar. Mana su 128px — dovoljno za kartice,
 * meko na velikoj slici profila.
 */
const USE_LOCAL_PORTRAITS = process.env.LOCAL_PORTRAITS === "1";

const portraitUrl = (id, slug) =>
  USE_LOCAL_PORTRAITS
    ? `/majstori/${slug}.jpg`
    : `https://randomuser.me/api/portraits/${id.gender}/${id.n}.jpg`;

const reviewerAvatarUrl = (n, gender) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

const BIO = {
  moleri: "Bavim se molerskim radovima više od {y} godina. Radim sve vrste molerskih radova: beljenje, farbanje, dekorativne tehnike, gletovanje i pripremu zidova. Dolazim na besplatno merenje i izlazim sa tačnom ponudom pre početka radova, bez naknadnih troškova. Prostor uvek zaštitim najlonom i po završetku ga ostavljam očišćenog. Garantujem kvalitet, čist rad i poštovanje dogovorenih rokova.",
  elektricari: "Električar sa {y} godina iskustva na terenu. Radim kompletne elektroinstalacije u stanovima i kućama, zamenu dotrajalih instalacija, ugradnju rasvete i otklanjanje kvarova. Izlazim i van radnog vremena za hitne slučajeve. Svaki posao ispratim merenjem i izdajem atest o ispravnosti instalacije. Radim isključivo sa kvalitetnim materijalom poznatih proizvođača.",
  vodoinstalateri: "Vodoinstalater sa {y} godina prakse. Specijalizovan sam za hitna odgušenja, zamenu vodovodnih i kanalizacionih cevi, ugradnju sanitarija i bojlera. Dostupan sam i vikendom jer kvarovi ne biraju dan. Dolazim sa kompletnom opremom, uključujući mašinu za odgušenje i kameru za pregled cevi, pa se problem najčešće reši u prvom izlasku.",
  keramicari: "Keramičar sa {y} godina iskustva. Postavljam zidne i podne pločice, granitnu keramiku velikih formata, radim hidroizolaciju kupatila i fugovanje. Posebnu pažnju posvećujem pripremi podloge jer od nje zavisi da li će posao izdržati. Radim precizno sečenje i obradu uglova pod 45 stepeni. Sve fotografije u galeriji su sa mojih radova.",
  stolari: "Stolar sa {y} godina iskustva u izradi nameštaja po meri. Radim kuhinje, plakare, police i komode prema vašem prostoru i želji. Dolazim na merenje, pravim 3D prikaz pre izrade i tek nakon vaše potvrde krećem u proizvodnju. Koristim kvalitetan iverica i MDF materijal, okov Blum ili Hettich. Montaža i odvoz ambalaže su uključeni u cenu.",
  "klima-uredjaji": "Serviser klima uređaja sa {y} godina iskustva i položenim ispitom za rad sa freonima. Radim ugradnju, redovan servis, čišćenje i dopunu freona za sve poznate brendove. Ugradnju izvodim tako da instalacija bude uredna i nevidljiva gde god je moguće. Dajem garanciju na ugradnju i pišem servisnu knjižicu za uređaj.",
  "gradjevinski-radovi": "Vodim ekipu za grube građevinske radove, {y} godina u poslu. Radimo zidanje, malterisanje, armirano-betonske radove, adaptacije stanova i rušenje sa odvozom šuta. Pre početka pravimo predmer i predračun sa jasnim stavkama, tako da znate na šta trošite. Radimo po dinamici koja je dogovorena i držimo gradilište urednim.",
  bravari: "Bravar sa {y} godina iskustva, dostupan za hitne intervencije. Otvaram zaključana vrata bez oštećenja, menjam brave i cilindre, radim izradu i montažu ograda, gelendera i rešetki. Za hitne pozive izlazim u roku od sat vremena na području grada. Na sve ugrađene brave dajem garanciju i preporučujem samo proverene proizvođače.",
  parketari: "Parketar sa {y} godina iskustva. Postavljam klasičan parket, brodski pod i laminat, radim hoblovanje, kitovanje i lakiranje. Koristim mašine sa usisivačem tako da prašine u stanu bude minimalno. Lakove nanosim u tri sloja sa međubrušenjem, što je jedini način da pod izdrži godine korišćenja. Merenje i savet o izboru materijala su besplatni.",
};

const REVIEW_TEXTS = [
  "Odličan rad! Brz, precizan i uredan. Preporuke!",
  "Sve završeno u dogovorenom roku, bez ijedne primedbe. Cena tačno kao u ponudi.",
  "Profesionalac u pravom smislu reči. Objasnio je sve unapred i nije bilo iznenađenja.",
  "Došao isti dan kada sam ga pozvao. Problem rešen za sat vremena.",
  "Vrlo korektan i ljubazan. Ostavio je sve čisto za sobom, što mi puno znači.",
  "Kvalitet rada je vidljiv. Malo je skuplji od drugih ponuda, ali se isplati.",
  "Sve pohvale. Već sam ga preporučila komšijama i svi su zadovoljni.",
  "Solidno urađeno, jedino je kasnio jedan dan. Rezultat je ipak odličan.",
];

const REVIEWERS = [
  ["Milan L.", 17, "men"], ["Jovana P.", 47, "women"], ["Nenad S.", 8, "men"],
  ["Tijana M.", 32, "women"], ["Aleksandar R.", 53, "men"], ["Marija K.", 25, "women"],
  ["Đorđe V.", 14, "men"], ["Sanja T.", 20, "women"],
];

const GLOBAL_AVERAGE = 4.7;
const M = 10;
const bayes = (avg, n) => (n / (n + M)) * avg + (M / (n + M)) * GLOBAL_AVERAGE;

/** Deterministički histogram koji se zbraja na `count` i daje traženi prosek. */
function distribution(average, count) {
  const five = Math.round(count * Math.min(0.95, Math.max(0.3, (average - 3.4) / 1.6)));
  const four = Math.round((count - five) * 0.72);
  const three = Math.round((count - five - four) * 0.7);
  const two = Math.max(0, count - five - four - three - (average < 4.6 ? 1 : 0));
  const one = Math.max(0, count - five - four - three - two);
  return { 5: five, 4: four, 3: three, 2: two, 1: one };
}

const majstori = [];
const reviews = [];
const users = [];
const stats = [];
let reviewIdx = 0;

majstorSpec.forEach((spec, i) => {
  const [name, categorySlug, city, muni, average, count, years, level, portrait, services] = spec;
  const slugBase = slugify(name);
  const category = categories.find((c) => c.slug === categorySlug);
  // Slug nosi ime + zanat + grad jer su to reči kojima se stvarno pretražuje.
  const slug = slugify(`${name} ${category.nameSingular.latn} ${city}`);
  const id = `maj_${i + 1}`;
  const userId = `usr_${i + 1}`;
  const createdAt = new Date(Date.UTC(2025, 2 + (i % 10), 3 + (i % 25), 9, 0, 0)).toISOString();

  users.push({
    id: userId,
    email: `${slugBase}@primer.rs`,
    emailVerifiedAt: createdAt,
    displayName: name,
    avatarUrl: portraitUrl(portrait, slug),
    role: "MAJSTOR",
    status: "ACTIVE",
    createdAt,
  });

  majstori.push({
    id,
    slug,
    userId,
    displayName: name,
    primaryCategoryId: category.id,
    categoryIds: [category.id],
    bio: BIO[categorySlug].replace("{y}", String(years)),
    avatarUrl: portraitUrl(portrait, slug),
    cityId: cityId(city),
    municipalityId: muniId(muni),
    servesCityIds: [cityId(city)],
    phone: `+3816${(i % 6) + 1}${String(1000000 + i * 137911).slice(0, 7)}`,
    yearsExperience: years,
    badges: ["PRO_TOOLS", "WARRANTY", ...(i % 3 === 0 ? ["INVOICE"] : []), ...(i % 4 === 0 ? ["EMERGENCY"] : [])],
    verificationLevel: level,
    status: "ACTIVE",
    services: services.map(([svcSlug, eur], si) => {
      const st = serviceTypes.find((s) => s.slug === svcSlug);
      return {
        id: `msv_${i + 1}_${si + 1}`,
        majstorId: id,
        serviceTypeId: st.id,
        priceFromMinor: eur === null ? null : rsd(eur),
        currency: "RSD",
        unit: eur === null ? "PO_DOGOVORU" : st.defaultUnit,
        sortOrder: si,
      };
    }),
    gallery: Array.from({ length: 4 + (i % 3) }, (_, g) => ({
      id: `pht_${i + 1}_${g + 1}`,
      url: `https://picsum.photos/seed/${slug}-${g + 1}/900/700`,
      width: 900,
      height: 700,
      alt: `${category.nameSingular.latn} ${name} — fotografija izvedenog rada ${g + 1}`,
      sortOrder: g,
    })),
    rating: {
      average,
      count,
      distribution: distribution(average, count),
      bayesianScore: Number(bayes(average, count).toFixed(4)),
    },
    seo: {
      title: `${name} — ${category.nameSingular.latn}`,
      description: `${category.nameSingular.latn} ${name}, ${average.toFixed(1)} od 5 na osnovu ${count} recenzija. Pogledajte cene usluga i fotografije radova.`,
    },
    createdAt,
    updatedAt: createdAt,
    publishedAt: createdAt,
  });

  stats.push({
    majstorId: id,
    profileViews: count * 2 + ((i * 37) % 50),
    phoneReveals: Math.round(count * 0.35) + (i % 7),
    messageCount: Math.round(count * 0.12) + (i % 4),
  });

  // Tri objavljene recenzije po majstoru + jedna koja čeka moderaciju.
  for (let r = 0; r < 4; r++) {
    const [author, avatar, avatarGender] = REVIEWERS[(i + r) % REVIEWERS.length];
    const pending = r === 3;
    const created = new Date(Date.UTC(2026, 6, 20 + ((i + r) % 10), 12, 0, 0)).toISOString();
    reviews.push({
      id: `rev_${++reviewIdx}`,
      majstorId: id,
      authorUserId: `usr_rev_${(i + r) % REVIEWERS.length + 1}`,
      authorDisplayName: author,
      authorAvatarUrl: reviewerAvatarUrl(avatar, avatarGender),
      rating: r === 3 ? 4 : average >= 4.8 ? 5 : 4 + (r % 2),
      body: REVIEW_TEXTS[(i + r) % REVIEW_TEXTS.length],
      serviceTypeId: svcId(services[r % services.length][0]),
      status: pending ? "PENDING" : "PUBLISHED",
      reply: r === 0 && i % 3 === 0
        ? { body: "Hvala na poverenju i na preporuci!", createdAt: created }
        : null,
      createdAt: created,
      moderatedAt: pending ? null : created,
      moderatorId: pending ? null : "usr_admin",
    });
  }
});

// ─────────────────────────────── Upis ───────────────────────────────

mkdirSync(OUT, { recursive: true });
const files = {
  "cities.json": cities,
  "municipalities.json": municipalities,
  "categories.json": categories,
  "service-types.json": serviceTypes,
  "users.json": users,
  "majstori.json": majstori,
  "majstor-stats.json": stats,
  "reviews.json": reviews,
};

for (const [file, data] of Object.entries(files)) {
  writeFileSync(join(OUT, file), JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${file.padEnd(22)} ${String(data.length).padStart(4)} zapisa`);
}

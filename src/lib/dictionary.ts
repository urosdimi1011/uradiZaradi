import type { LocalizedText } from "@/modules/shared/domain/primitives";
import type { Script } from "@/lib/script";

/**
 * Statički UI tekstovi u oba pisma.
 *
 * Namerno NIJE next-intl JSON: ovo nije prevod na drugi jezik nego transliteracija
 * istog teksta, pa držanje para na jednom mestu sprečava da se varijante raziđu.
 * Kad se doda pravi strani jezik (npr. engleski za dijasporu), prelazi se na next-intl.
 */
const d = <T extends Record<string, LocalizedText>>(x: T) => x;

export const ui = d({
  brandLine1: { latn: "Uradi", cyrl: "Уради" },
  brandLine2: { latn: "zaradi", cyrl: "заради" },

  signIn: { latn: "Prijava", cyrl: "Пријава" },
  signUp: { latn: "Registracija", cyrl: "Регистрација" },
  saved: { latn: "Sačuvano", cyrl: "Сачувано" },

  searchPlaceholder: { latn: "Koji majstor vam treba?", cyrl: "Који мајстор вам треба?" },
  search: { latn: "Pretraži", cyrl: "Претражи" },
  filters: { latn: "Filtrirajte rezultate", cyrl: "Филтрирајте резултате" },
  applyFilters: { latn: "Primeni filtere", cyrl: "Примени филтере" },
  clearFilters: { latn: "Poništi filtere", cyrl: "Поништи филтере" },
  category: { latn: "Kategorija", cyrl: "Категорија" },
  service: { latn: "Usluga", cyrl: "Услуга" },
  showResults: { latn: "Prikaži rezultate", cyrl: "Прикажи резултате" },
  close: { latn: "Zatvori", cyrl: "Затвори" },
  menu: { latn: "Meni", cyrl: "Мени" },
  navigation: { latn: "Navigacija", cyrl: "Навигација" },
  script: { latn: "Pismo", cyrl: "Писмо" },
  allCategories: { latn: "Sve kategorije", cyrl: "Све категорије" },
  location: { latn: "Lokacija", cyrl: "Локација" },
  price: { latn: "Cena", cyrl: "Цена" },
  rating: { latn: "Ocena", cyrl: "Оцена" },
  from: { latn: "Od", cyrl: "Од" },
  to: { latn: "Do", cyrl: "До" },
  verifiedOnly: { latn: "Prikaži samo verifikovane", cyrl: "Прикажи само верификоване" },
  verifiedMajstori: { latn: "Verifikovani majstori", cyrl: "Верификовани мајстори" },
  sortBy: { latn: "Sortiraj po", cyrl: "Сортирај по" },
  newest: { latn: "Najnoviji", cyrl: "Најновији" },
  bestRated: { latn: "Najbolje ocenjeni", cyrl: "Најбоље оцењени" },
  priceAsc: { latn: "Najniža cena", cyrl: "Најнижа цена" },

  newestMajstori: { latn: "Najnoviji majstori", cyrl: "Најновији мајстори" },
  showAll: { latn: "Prikaži sve", cyrl: "Прикажи све" },
  more: { latn: "Više", cyrl: "Више" },
  backToSearch: { latn: "Nazad na pretragu", cyrl: "Назад на претрагу" },
  noResults: { latn: "Nema rezultata za izabrane filtere.", cyrl: "Нема резултата за изабране филтере." },
  noResultsHint: {
    latn: "Pokušajte da uklonite neki filter ili proširite lokaciju.",
    cyrl: "Покушајте да уклоните неки филтер или проширите локацију.",
  },

  promoted: { latn: "Promovisano", cyrl: "Промовисано" },
  reviews: { latn: "Recenzije", cyrl: "Рецензије" },
  reviewsCountLabel: { latn: "recenzija", cyrl: "рецензија" },
  views: { latn: "pregleda", cyrl: "прегледа" },
  messages: { latn: "poruka", cyrl: "порука" },
  aboutMajstor: { latn: "O majstoru", cyrl: "О мајстору" },
  servicesAndPrices: { latn: "Usluge i cene", cyrl: "Услуге и цене" },
  showAllServices: { latn: "Prikaži sve usluge", cyrl: "Прикажи све услуге" },
  workPhotos: { latn: "Fotografije radova", cyrl: "Фотографије радова" },
  morePhotos: { latn: "još fotografija", cyrl: "још фотографија" },
  byAgreement: { latn: "Po dogovoru", cyrl: "По договору" },

  showPhone: { latn: "Prikaži broj telefona", cyrl: "Прикажи број телефона" },
  callMajstor: { latn: "Pozovite majstora", cyrl: "Позовите мајстора" },
  saveMajstor: { latn: "Sačuvaj majstora", cyrl: "Сачувај мајстора" },
  sendMessage: { latn: "Pošaljite poruku", cyrl: "Пошаљите поруку" },
  comingSoon: { latn: "Uskoro", cyrl: "Ускоро" },

  yearsExperience: { latn: "godina iskustva", cyrl: "година искуства" },
  badgeProTools: { latn: "Profesionalan alat", cyrl: "Професионалан алат" },
  badgeWarranty: { latn: "Garancija na rad", cyrl: "Гаранција на рад" },
  badgeInvoice: { latn: "Izdaje račun", cyrl: "Издаје рачун" },
  badgeEmergency: { latn: "Hitne intervencije", cyrl: "Хитне интервенције" },

  // Auth
  signInTitle: { latn: "Prijavite se na nalog", cyrl: "Пријавите се на налог" },
  emailOrUsername: { latn: "E-pošta ili korisničko ime", cyrl: "Е-пошта или корисничко име" },
  password: { latn: "Lozinka", cyrl: "Лозинка" },
  forgotPassword: { latn: "Zaboravili ste lozinku?", cyrl: "Заборавили сте лозинку?" },
  or: { latn: "ili", cyrl: "или" },
  signInGoogle: { latn: "Prijava preko Google", cyrl: "Пријава преко Google" },
  signInFacebook: { latn: "Prijava preko Facebook", cyrl: "Пријава преко Facebook" },
  noAccount: { latn: "Nemate nalog?", cyrl: "Немате налог?" },

  // Registracija majstora
  becomeMajstor: { latn: "Postanite majstor", cyrl: "Постаните мајстор" },
  postJob: { latn: "Objavi posao", cyrl: "Објави посао" },
  majstorRegTitle: { latn: "Registrujte se kao majstor", cyrl: "Региструјте се као мајстор" },
  majstorRegLead: {
    latn: "Popunite profil i pojavite se u pretrazi kod ljudi kojima treba vaš zanat.",
    cyrl: "Попуните профил и појавите се у претрази код људи којима треба ваш занат.",
  },
  stepAccount: { latn: "Nalog", cyrl: "Налог" },
  stepProfession: { latn: "Zanat", cyrl: "Занат" },
  stepProfile: { latn: "Profil", cyrl: "Профил" },
  stepVerification: { latn: "Verifikacija", cyrl: "Верификација" },
  fullName: { latn: "Ime i prezime", cyrl: "Име и презиме" },
  email: { latn: "E-pošta", cyrl: "Е-пошта" },
  phone: { latn: "Broj telefona", cyrl: "Број телефона" },
  city: { latn: "Grad", cyrl: "Град" },
  municipality: { latn: "Opština", cyrl: "Општина" },
  chooseCategory: { latn: "Izaberite kategoriju", cyrl: "Изаберите категорију" },
  chooseServices: { latn: "Izaberite usluge koje radite", cyrl: "Изаберите услуге које радите" },
  aboutYou: { latn: "Nekoliko rečenica o vama", cyrl: "Неколико реченица о вама" },
  aboutYouHint: {
    latn: "Najmanje 200 karaktera. Profili sa detaljnim opisom se bolje kotiraju u pretrazi.",
    cyrl: "Најмање 200 карактера. Профили са детаљним описом се боље котирају у претрази.",
  },
  continue: { latn: "Nastavi", cyrl: "Настави" },
  profileCompleteness: { latn: "Profil popunjen", cyrl: "Профил попуњен" },

  // Footer / trust
  trustVerifiedTitle: { latn: "Verifikovani majstori", cyrl: "Верификовани мајстори" },
  trustVerifiedText: { latn: "Svi majstori su provereni", cyrl: "Сви мајстори су проверени" },
  trustPayTitle: { latn: "Bezbedna plaćanja", cyrl: "Безбедна плаћања" },
  trustPayText: { latn: "Plaćajte bezbedno preko platforme", cyrl: "Плаћајте безбедно преко платформе" },
  trustFastTitle: { latn: "Brzo i lako", cyrl: "Брзо и лако" },
  trustFastText: { latn: "Pronađite majstora za nekoliko klikova", cyrl: "Пронађите мајстора за неколико кликова" },
  trustSupportTitle: { latn: "Podrška 24/7", cyrl: "Подршка 24/7" },
  trustSupportText: { latn: "Tu smo za vas uvek", cyrl: "Ту смо за вас увек" },

  // Mobilna navigacija
  navHome: { latn: "Početna", cyrl: "Почетна" },
  navSearch: { latn: "Pretraga", cyrl: "Претрага" },
  navSaved: { latn: "Sačuvano", cyrl: "Сачувано" },
  navProfile: { latn: "Profil", cyrl: "Профил" },

  scriptToggleLabel: { latn: "Ćirilica", cyrl: "Latinica" },
  demoBanner: {
    latn: "Demo verzija — podaci su izmišljeni radi prikaza dizajna.",
    cyrl: "Демо верзија — подаци су измишљени ради приказа дизајна.",
  },
});

export type UiKey = keyof typeof ui;

/** Pomoćnik koji se vezuje za jedno pismo, da se `script` ne prosleđuje kroz svaki poziv. */
export function makeT(script: Script) {
  return (key: UiKey): string => (script === "cyrl" ? ui[key].cyrl : ui[key].latn);
}

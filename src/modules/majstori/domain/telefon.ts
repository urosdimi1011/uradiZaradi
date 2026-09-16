/**
 * Srpski brojevi telefona.
 *
 * Broj je u šemi `@unique` — jedan profil po broju je prva prepreka lažnim
 * nalozima. Zato mora da se svede na JEDAN oblik pre upisa: bez toga bi isti
 * čovek upisao „064 123 4567" pa „+381641234567" i dobio dva profila, a
 * jedinstvenost ne bi ništa značila.
 *
 * Kanonski oblik je `+381641234567` — bez razmaka, sa pozivnim brojem države.
 * Prikaz se formatira posebno; u bazi stoji oblik koji se može porediti.
 */

/**
 * Šta se prihvata pri unosu.
 *
 * Namerno široko: ljudi kucaju broj na šest načina i svi su tačni. Razmaci,
 * crtice, kose crte, zagrade, vodeća nula, `+381`, `00381` — sve to ulazi, a
 * `normalizujTelefon` svodi na jedan oblik.
 *
 * Provera se radi POSLE svođenja, ne nad sirovim unosom. Izraz koji bi pokrio
 * sve oblike odjednom bio bi nečitljiv i svejedno bi nešto propustio.
 */
const ZA_BRISANJE = /[\s\-/().]/g;

/**
 * Kanonski oblik.
 *
 * `+381` pa nacionalni broj od 8 ili 9 cifara koji ne počinje nulom.
 * Mobilni su `6x` (8–9 cifara), fiksni `1x`–`3x`.
 *
 * Namerno se NE proverava da li tačno taj opseg postoji kod tačno tog
 * operatera. Takva provera zastareva čim regulator dodeli nov opseg, a cena
 * greške je da pravom majstoru odbijemo pravi broj. Dužina i pozivni broj
 * hvataju prekucavanje, a stvarnu ispravnost dokazuje tek poslati SMS.
 */
export const TELEFON_KANONSKI_RE = /^\+381[1-9]\d{7,8}$/;

/**
 * Svodi uneti broj na kanonski oblik, ili vraća `null` ako nije srpski broj.
 *
 * Koraci:
 *   „064 123-4567"   → obriši razdvajače → „0641234567" → „+381641234567"
 *   „00381641234567" → „+381641234567"
 *   „+381 64 1234567"→ „+381641234567"
 */
export function normalizujTelefon(unos: string): string | null {
  const ocisceno = unos.trim().replace(ZA_BRISANJE, "");
  if (!ocisceno) return null;

  let broj: string;

  if (ocisceno.startsWith("+")) {
    broj = ocisceno;
  } else if (ocisceno.startsWith("00")) {
    broj = `+${ocisceno.slice(2)}`;
  } else if (ocisceno.startsWith("0")) {
    /* Domaći zapis: vodeća nula se menja pozivnim brojem države. */
    broj = `+381${ocisceno.slice(1)}`;
  } else {
    /* Bez ikakvog prefiksa — pretpostavlja se domaći broj („641234567"). */
    broj = `+381${ocisceno}`;
  }

  /* Sve osim cifara i vodećeg plusa znači da je u broju bilo slova. */
  if (!/^\+\d+$/.test(broj)) return null;

  return TELEFON_KANONSKI_RE.test(broj) ? broj : null;
}

/**
 * Kanonski broj u oblik za čitanje: `+381641234567` → `064 123 4567`.
 *
 * Prikazuje se domaći zapis, jer majstora zove neko iz Srbije i tako ga i
 * prepoznaje. Međunarodni oblik ostaje u bazi i u `tel:` linku.
 */
export function prikaziTelefon(kanonski: string): string {
  if (!TELEFON_KANONSKI_RE.test(kanonski)) return kanonski;

  const nacionalni = `0${kanonski.slice(4)}`;

  /* Mobilni: 064 123 4567 / 064 123 456. Fiksni: 011 123 456. */
  const [, pozivni, ostatak] = /^(\d{3})(\d+)$/.exec(nacionalni) ?? [];
  if (!pozivni || !ostatak) return nacionalni;

  const prvi = ostatak.slice(0, 3);
  const drugi = ostatak.slice(3);
  return drugi ? `${pozivni} ${prvi} ${drugi}` : `${pozivni} ${prvi}`;
}

/** Za `tel:` link — bez razmaka, međunarodni oblik. */
export function telefonZaPoziv(kanonski: string): string {
  return kanonski.replace(ZA_BRISANJE, "");
}

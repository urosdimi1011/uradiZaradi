import { z } from "zod";

/**
 * Pravila za prijavu i registraciju.
 *
 * Zod je već izvor istine za ostatak domena (kategorije, majstori, recenzije),
 * pa nema razloga uvoditi drugu biblioteku samo za forme. Isti alat, isti stil
 * poruka, nula novih zavisnosti.
 *
 * Provera se izvršava NA SERVERU, u Server Action-u. Sve što se dešava u
 * pretraživaču je udobnost — napadač šalje POST direktno i preskače svaki
 * `pattern` atribut i svaki `useState`.
 */

/*
 * ── Izrazi ──
 *
 * Telo izraza je bez sidara (`^`, `$`) namerno: HTML `pattern` atribut sam sidri
 * izraz, dok Zod ne. Zato se sidra dodaju samo za Zod, a atribut dobija isto
 * telo. Jedno pravilo — jedan izraz, korišćen na oba mesta.
 *
 * `String.raw` da kose crte ne moraju dvostruko da se beže.
 */

/**
 * E-pošta namerno NIJE po RFC 5322.
 *
 * Potpun izraz za adresu je čudovište od nekoliko hiljada znakova koje propušta
 * adrese kakve nijedan server pošte u praksi ne prihvata. Ovaj traži ono što
 * zaista ima smisla: nešto, pa @, pa domen sa tačkom i slovnim nastavkom.
 * Pravu proveru radi poslata poruka na tu adresu, ne izraz.
 */
const EMAIL_BODY = String.raw`[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}`;

/**
 * Ime: počinje slovom, pa slova, razmaci, crtica i apostrof.
 *
 * `\p{L}` umesto `[A-Za-z]` — inače „Đorđe Šćepanović-Marić" pada, a to je
 * sasvim obično srpsko ime. `\p{M}` hvata kombinujuće znakove, jer se ć može
 * upisati i kao c + akcenat (neke tastature to rade).
 */
const NAME_BODY = String.raw`\p{L}[\p{L}\p{M}\s'’.\-]{1,59}`;

/**
 * Lozinka: najmanje 8 znakova, bar jedno slovo i bar jedna cifra, bez razmaka.
 *
 * Namerno se NE traže velika slova i specijalni znakovi. NIST je od toga odustao
 * 2017: takva pravila ne daju jače lozinke, nego `Lozinka1!` — predvidljiv
 * obrazac koji svaki alat za pogađanje zna napamet. Dužina nosi otpornost;
 * slovo + cifra samo zaustavlja `12345678` i `lozinkaa`.
 */
const PASSWORD_BODY = String.raw`(?=.*\p{L})(?=.*\d)[^\s]{8,}`;

export const EMAIL_RE = new RegExp(`^${EMAIL_BODY}$`, "u");
export const NAME_RE = new RegExp(`^${NAME_BODY}$`, "u");
export const PASSWORD_RE = new RegExp(`^${PASSWORD_BODY}$`, "u");

/**
 * Vrednosti za `pattern` atribut na inputu.
 *
 * Ime i e-pošta trpe razmake sa strane, jer server pre provere radi `.trim()`, a
 * pretraživač ne radi ništa. Bez toga bi jedan slučajan razmak na kraju adrese
 * digao poruku o grešci za nešto što server uredno prihvata.
 *
 * Lozinka razmake ne trpi ni ovde ni tamo — ona se ne seče, jer je razmak njen
 * legitiman deo i tiho sečenje bi promenilo lozinku korisniku iza leđa.
 */
export const PATTERNS = {
  email: String.raw`\s*${EMAIL_BODY}\s*`,
  name: String.raw`\s*${NAME_BODY}\s*`,
  password: PASSWORD_BODY,
} as const;

/**
 * Poruke o greškama — jedno mesto za obe provere.
 *
 * Iste rečenice koristi Zod na serveru i pretraživač u svom mehuriću. Da su
 * pisane dvaput, jedna bi pre ili kasnije ostala na starom pravilu, pa bi
 * korisnik dobijao dva različita objašnjenja za istu grešku.
 *
 * `required` i `tooShort` postoje zato što pretraživač za njih javlja svoju
 * poruku na jeziku sistema („Please fill out this field."), a Zod ih nikad ne
 * vidi — polje do servera stiže prazno ili kratko i tu se proverava ponovo.
 */
export const PORUKE = {
  name: {
    required: "Unesite ime i prezime.",
    tooShort: "Ime mora da ima bar 2 znaka.",
    tooLong: "Ime je predugačko.",
    pattern: "Ime sme da sadrži samo slova, razmak, crticu i apostrof.",
  },
  email: {
    required: "Unesite e-poštu.",
    tooLong: "E-pošta je predugačka.",
    pattern: "Unesite ispravnu e-poštu, na primer pera@gmail.com.",
  },
  password: {
    required: "Unesite lozinku.",
    tooShort: "Lozinka mora da ima najmanje 8 znakova.",
    tooLong: "Lozinka je predugačka.",
    pattern: "Lozinka mora da sadrži bar jedno slovo i jednu cifru, bez razmaka.",
  },
} as const;

/** Oblik koji `fields.tsx` prosleđuje pretraživaču. */
export type PorukePolja = {
  required?: string;
  tooShort?: string;
  tooLong?: string;
  pattern?: string;
};

const emailField = z
  .string()
  .trim()
  /*
   * Mala slova pre provere i pre upisa. Bez ovoga `Pera@gmail.com` i
   * `pera@gmail.com` postaju dva naloga, a korisnik ne zna kojim se registrovao.
   */
  .toLowerCase()
  .min(1, PORUKE.email.required)
  .max(254, PORUKE.email.tooLong)
  .regex(EMAIL_RE, PORUKE.email.pattern);

/**
 * Prijava proverava SAMO da polja nisu prazna.
 *
 * Ovde se ne primenjuju pravila o jačini lozinke. Ako sutra pooštrimo pravilo,
 * svi sa starijim lozinkama bi ostali zaključani van sopstvenog naloga — a nisu
 * ništa skrivili. Jačina se proverava tamo gde se lozinka postavlja.
 */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, PORUKE.email.required),
  password: z.string().min(1, PORUKE.password.required),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, PORUKE.name.tooShort)
    .max(60, PORUKE.name.tooLong)
    .regex(NAME_RE, PORUKE.name.pattern),
  email: emailField,
  password: z
    .string()
    .min(8, PORUKE.password.tooShort)
    /*
     * Gornja granica nije hir: neki algoritmi za heširanje tiho odsecaju ulaz
     * posle određene dužine, pa bi korisnik mislio da ima dugu lozinku a imao
     * kratku. Bolje odbiti nego tiho skratiti.
     */
    .max(128, PORUKE.password.tooLong)
    .regex(PASSWORD_RE, PORUKE.password.pattern),
  /*
   * Forma nudi tačno dve uloge. `catch` znači: sve drugo — `ADMIN`, đubre iz
   * skripte, izostavljeno polje — tiho postaje `USER`. Podizanje privilegija
   * kroz formu nije moguće po konstrukciji, ne po proveri koja može da se
   * zaboravi.
   */
  uloga: z.enum(["USER", "MAJSTOR"]).catch("USER"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

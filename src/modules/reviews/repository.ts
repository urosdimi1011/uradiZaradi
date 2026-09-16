import "server-only";

import type { ReviewModel } from "@/generated/prisma/models";
import { db } from "@/lib/db";
import type { ReviewStatus } from "@/generated/prisma/enums";
import { bayesianScore, type Review } from "./domain";

/** Recenzija kako je vidi administracija — sa tragom koji javni deo nikad ne dobija. */
export type ReviewZaModeraciju = Review & { moderatorNote: string | null };

function toReview(row: ReviewModel): Review {
  return {
    id: row.id,
    majstorId: row.majstorId,
    authorUserId: row.authorUserId,
    authorDisplayName: row.authorDisplayName,
    authorAvatarUrl: row.authorAvatarUrl,
    rating: row.rating,
    body: row.body,
    serviceTypeId: row.serviceTypeId,
    status: row.status,
    /* Odgovor majstora je u bazi razložen na dve kolone; domen ga vidi kao objekat. */
    reply:
      row.replyBody && row.replyCreatedAt
        ? { body: row.replyBody, createdAt: row.replyCreatedAt }
        : null,
    createdAt: row.createdAt,
    moderatedAt: row.moderatedAt,
    moderatorId: row.moderatorId,
  };
}

/**
 * Ponovo izračunava zbirne ocene majstora iz OBJAVLJENIH recenzija.
 *
 * `Majstor` nosi pet denormalizovanih kolona (prosek, broj, raspodela, Bayesian)
 * jer se po njima i filtrira i sortira — `AVG()` nad spojenom tabelom ne može
 * da koristi indeks. Cena toga je da se moraju održavati.
 *
 * Zove se posle SVAKE promene statusa recenzije: nova objavljena, odobrena iz
 * reda, odbijena, sakrivena. Propušten poziv ne obara ništa — samo ostavi
 * pogrešnu ocenu na kartici, i to niko ne primeti.
 *
 * Globalni prosek je potreban za Bayesian, pa se računa istim upitom nad svim
 * objavljenim recenzijama platforme.
 */
async function preracunajOcene(majstorId: string) {
  const [recenzije, globalno] = await Promise.all([
    db.review.findMany({
      where: { majstorId, status: "PUBLISHED" },
      select: { rating: true },
    }),
    db.review.aggregate({ where: { status: "PUBLISHED" }, _avg: { rating: true } }),
  ]);

  const count = recenzije.length;
  const zbir = recenzije.reduce((a, r) => a + r.rating, 0);
  const average = count > 0 ? zbir / count : 0;

  const raspodela = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const r of recenzije) raspodela[r.rating] = (raspodela[r.rating] ?? 0) + 1;

  /* Bez ijedne recenzije na platformi globalni prosek ne postoji — uzima se sredina. */
  const globalniProsek = globalno._avg.rating ?? 4;

  await db.majstor.update({
    where: { id: majstorId },
    data: {
      ratingAverage: average,
      ratingCount: count,
      ratingBayesian: bayesianScore(average, count, globalniProsek),
      ratingDist1: raspodela[1] ?? 0,
      ratingDist2: raspodela[2] ?? 0,
      ratingDist3: raspodela[3] ?? 0,
      ratingDist4: raspodela[4] ?? 0,
      ratingDist5: raspodela[5] ?? 0,
    },
  });
}

export const reviewRepository = {
  /**
   * Ponovo izračunaj prosek, broj i raspodelu ocena jednog majstora.
   *
   * Izloženo administraciji: brisanje recenzije i sklanjanje recenzija banovanog
   * naloga menjaju osnovu po kojoj je prosek izračunat. Bez ovoga majstoru ostaje
   * ocena od recenzija kojih više nema.
   */
  preracunajOcene,

  /** Majstori koje je taj nalog ocenio — kojima posle bana treba novi prosek. */
  async majstoriSaRecenzijamaAutora(authorUserId: string): Promise<string[]> {
    const redovi = await db.review.findMany({
      where: { authorUserId },
      select: { majstorId: true },
      distinct: ["majstorId"],
    });
    return redovi.map((r) => r.majstorId);
  },

  /** Da li je korisnik već ocenio tog majstora — u BILO kom statusu. */
  async vecOcenio(majstorId: string, authorUserId: string): Promise<boolean> {
    const zapis = await db.review.findUnique({
      where: { majstorId_authorUserId: { majstorId, authorUserId } },
      select: { id: true },
    });
    return zapis !== null;
  },

  /**
   * Upisuje recenziju i osvežava zbirne ocene.
   *
   * Osvežavanje ide i kad recenzija ode u `PENDING` — tada ne menja ništa, jer
   * se računaju samo objavljene. Poziv je svejedno tu, da se ne zaboravi kad se
   * pravila jednom promene.
   */
  async dodaj(podaci: {
    majstorId: string;
    authorUserId: string;
    authorDisplayName: string;
    authorAvatarUrl: string | null;
    rating: number;
    body: string;
    serviceTypeId: string | null;
    status: ReviewStatus;
  }) {
    await db.review.create({ data: podaci });
    await preracunajOcene(podaci.majstorId);
  },

  /** Moderacija: odobri, odbij ili sakrij — pa preračunaj. */
  async postaviStatus(reviewId: string, status: ReviewStatus, moderatorId: string) {
    const recenzija = await db.review.update({
      where: { id: reviewId },
      data: { status, moderatedAt: new Date(), moderatorId },
      select: { majstorId: true },
    });

    await preracunajOcene(recenzija.majstorId);
  },

  /** Javno se nikad ne vraćaju PENDING/REJECTED/HIDDEN recenzije. */
  async listPublished(majstorId: string, limit?: number): Promise<Review[]> {
    const rows = await db.review.findMany({
      where: { majstorId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    return rows.map(toReview);
  },

  /**
   * Red za moderaciju — koristi ga admin panel.
   *
   * Vraća `Review` PLUS internu belešku. Beleška NIJE deo `Review` tipa
   * namerno: taj tip ide i na javnu stranicu recenzija, gde se prosleđuje
   * klijentskoj komponenti — a sve što stigne do klijentske komponente stoji u
   * HTML-u koji svako može da pročita. Jedno polje u zajedničkom tipu bilo bi
   * dovoljno da interne beleške moderacije izađu na sajt.
   */
  async listPending(): Promise<ReviewZaModeraciju[]> {
    const rows = await db.review.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({ ...toReview(row), moderatorNote: row.moderatorNote }));
  },
};

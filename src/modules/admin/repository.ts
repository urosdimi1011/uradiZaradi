import "server-only";

import { db } from "@/lib/db";
import type { KategorijaUnos, UslugaUnos } from "./domain/forme";
import type { UserRole, UserStatus } from "./domain/pravila";

/**
 * Upiti administracije.
 *
 * Odvojeni od `catalogRepository` namerno: taj čita objavljeni katalog za
 * posetioce i nikad ne piše. Ovaj piše i vidi i ugašene stavke — mešanje to
 * dvoje znači da jedna greška u filteru pusti ugašenu kategoriju na sajt.
 */
export const adminRepository = {
  /* ─────────────────── Kategorije ─────────────────── */

  /** Sve kategorije, i ugašene, sa brojevima koji odlučuju sme li brisanje. */
  async listKategorije() {
    const redovi = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameLatn: "asc" }],
      include: { _count: { select: { majstori: true, serviceTypes: true } } },
    });

    return redovi.map((r) => ({
      id: r.id,
      slug: r.slug,
      naziv: r.nameLatn,
      icon: r.icon,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      brojMajstora: r._count.majstori,
      brojUsluga: r._count.serviceTypes,
    }));
  },

  async nadjiKategoriju(id: string) {
    return db.category.findUnique({
      where: { id },
      include: {
        _count: { select: { majstori: true, serviceTypes: true } },
        serviceTypes: {
          orderBy: [{ sortOrder: "asc" }, { nameLatn: "asc" }],
          include: { _count: { select: { majstorServices: true } } },
        },
      },
    });
  },

  async napraviKategoriju(unos: KategorijaUnos) {
    return db.category.create({ data: uKolone(unos) });
  },

  /**
   * Izmena kategorije BEZ sluga.
   *
   * Slug se izbacuje ovde, u sloju koji piše — a ne samo tako što ga forma ne
   * šalje. Forma se može zaobići; ovo ne može.
   */
  async izmeniKategoriju(id: string, unos: KategorijaUnos) {
    const kolone = uKolone(unos);
    delete (kolone as Partial<typeof kolone>).slug;
    return db.category.update({ where: { id }, data: kolone });
  },

  async obrisiKategoriju(id: string) {
    await db.category.delete({ where: { id } });
  },

  /* ─────────────────── Usluge ─────────────────── */

  async napraviUslugu(unos: UslugaUnos) {
    return db.serviceType.create({
      data: {
        slug: unos.slug,
        categoryId: unos.categoryId,
        nameLatn: unos.nameLatn,
        nameCyrl: unos.nameCyrl,
        defaultUnit: unos.defaultUnit,
        allowedUnits: unos.allowedUnits,
        sortOrder: unos.sortOrder,
        isActive: unos.isActive,
      },
    });
  },

  async izmeniUslugu(id: string, unos: UslugaUnos) {
    return db.serviceType.update({
      where: { id },
      data: {
        categoryId: unos.categoryId,
        nameLatn: unos.nameLatn,
        nameCyrl: unos.nameCyrl,
        defaultUnit: unos.defaultUnit,
        allowedUnits: unos.allowedUnits,
        sortOrder: unos.sortOrder,
        isActive: unos.isActive,
      },
    });
  },

  async nadjiUslugu(id: string) {
    return db.serviceType.findUnique({
      where: { id },
      include: { _count: { select: { majstorServices: true } } },
    });
  },

  async obrisiUslugu(id: string) {
    await db.serviceType.delete({ where: { id } });
  },

  /* ─────────────────── Korisnici ─────────────────── */

  async listKorisnike(filter: { upit?: string; uloga?: UserRole; status?: UserStatus }) {
    const upit = filter.upit?.trim();

    return db.user.findMany({
      where: {
        ...(filter.uloga ? { role: filter.uloga } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(upit
          ? {
              OR: [
                { email: { contains: upit, mode: "insensitive" as const } },
                { displayName: { contains: upit, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        majstor: { select: { id: true, slug: true, status: true } },
        _count: { select: { reviews: true, sessions: true } },
      },
    });
  },

  async nadjiKorisnika(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        majstor: { select: { id: true, slug: true, status: true, displayName: true } },
        accounts: { select: { providerId: true } },
        _count: { select: { reviews: true, sessions: true } },
      },
    });
  },

  async brojAdmina(): Promise<number> {
    return db.user.count({ where: { role: "ADMIN" } });
  },

  /**
   * Status naloga i sve što iz njega sledi, u JEDNOJ transakciji.
   *
   * Da su ovo tri odvojena upisa, pad na drugom ostavio bi banovan nalog sa
   * živom sesijom — tačno ono stanje zbog kog sesije i stoje u bazi.
   */
  async postaviStatusKorisnika(opcije: {
    userId: string;
    status: UserStatus;
    skloniProfil: boolean;
    skloniRecenzije: boolean;
    prekiniSesije: boolean;
  }) {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: opcije.userId }, data: { status: opcije.status } });

      if (opcije.prekiniSesije) {
        await tx.session.deleteMany({ where: { userId: opcije.userId } });
      }

      const majstor = await tx.majstor.findUnique({
        where: { userId: opcije.userId },
        select: { id: true },
      });

      if (majstor) {
        await tx.majstor.update({
          where: { id: majstor.id },
          data: {
            status:
              opcije.status === "ACTIVE"
                ? "ACTIVE"
                : opcije.status === "SUSPENDED"
                  ? "SUSPENDED"
                  : "BANNED",
          },
        });
      }

      if (opcije.skloniRecenzije) {
        await tx.review.updateMany({
          where: { authorUserId: opcije.userId, status: "PUBLISHED" },
          data: { status: "HIDDEN" },
        });
      }
    });
  },

  /** Odjava sa svih uređaja, bez menjanja statusa. */
  async obrisiSesije(userId: string): Promise<number> {
    const { count } = await db.session.deleteMany({ where: { userId } });
    return count;
  },

  /* ─────────────────── Recenzije ─────────────────── */

  async obrisiRecenziju(id: string) {
    const red = await db.review.findUnique({ where: { id }, select: { majstorId: true } });
    if (!red) return null;
    await db.review.delete({ where: { id } });
    return red.majstorId;
  },

  async postaviBelesku(id: string, beleska: string) {
    await db.review.update({
      where: { id },
      /* Prazna beleška se briše, ne čuva kao prazan string. */
      data: { moderatorNote: beleska === "" ? null : beleska },
    });
  },
};

function uKolone(unos: KategorijaUnos) {
  return {
    slug: unos.slug,
    nameLatn: unos.nameLatn,
    nameCyrl: unos.nameCyrl,
    nameSingularLatn: unos.nameSingularLatn,
    nameSingularCyrl: unos.nameSingularCyrl,
    icon: unos.icon,
    introLatn: unos.introLatn,
    introCyrl: unos.introCyrl,
    seoTitle: unos.seoTitle ?? null,
    seoDescription: unos.seoDescription ?? null,
    sortOrder: unos.sortOrder,
    isActive: unos.isActive,
  };
}

import "server-only";

import { db } from "@/lib/db";

/**
 * Sačuvani majstori.
 *
 * `SavedMajstor` nosi ILI `userId` ILI `deviceId` — nikad oba, nikad nijedno.
 * To pravilo stoji kao CHECK ograničenje u bazi (`SavedMajstor_owner_check`),
 * ne samo u kodu: zapis bez vlasnika ne bi imao kome da pripada, a zapis sa oba
 * bi se pojavljivao dvaput.
 *
 * Zasad se koristi samo `userId`. Kolona `deviceId` postoji da bi gost jednog
 * dana mogao da čuva majstore pre nego što napravi nalog, a da mu se lista
 * prenese pri prijavi. Do tada gost ide na prijavu.
 */
export const savedRepository = {
  /**
   * Uključi/isključi — vraća stanje POSLE promene.
   *
   * Prvo se pokušava brisanje. Ako je nešto obrisano, majstor je bio sačuvan i
   * sad više nije; ako nije, dodaje se. Jedan upit manje nego provera pa
   * odluka, i nema prozora u kom dva brza klika naprave dva reda.
   */
  async toggle(userId: string, majstorId: string): Promise<boolean> {
    const { count } = await db.savedMajstor.deleteMany({ where: { userId, majstorId } });
    if (count > 0) return false;

    try {
      await db.savedMajstor.create({ data: { userId, majstorId } });
      return true;
    } catch (error) {
      /*
       * P2002 znači da je drugi zahtev stigao prvi — dva klika u istom
       * trenutku. Ishod je isti kao da je ovaj uspeo, pa se ne javlja greška.
       */
      if ((error as { code?: string }).code === "P2002") return true;
      throw error;
    }
  },

  async isSaved(userId: string, majstorId: string): Promise<boolean> {
    const zapis = await db.savedMajstor.findUnique({
      where: { userId_majstorId: { userId, majstorId } },
      select: { id: true },
    });
    return zapis !== null;
  },

  /**
   * Koji su od PONUĐENIH majstora sačuvani.
   *
   * Za listing: jedan upit za celu stranicu umesto po jednog za svaku karticu.
   * Bez ovoga bi mreža od dvanaest kartica napravila dvanaest upita.
   */
  async savedIds(userId: string, majstorIds: string[]): Promise<Set<string>> {
    if (majstorIds.length === 0) return new Set();

    const redovi = await db.savedMajstor.findMany({
      where: { userId, majstorId: { in: majstorIds } },
      select: { majstorId: true },
    });
    return new Set(redovi.map((r) => r.majstorId));
  },

  async count(userId: string): Promise<number> {
    return db.savedMajstor.count({ where: { userId } });
  },

  /** Id-jevi sačuvanih, najnoviji prvi — redosled po kom se i prikazuju. */
  async listIds(userId: string): Promise<string[]> {
    const redovi = await db.savedMajstor.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { majstorId: true },
    });
    return redovi.map((r) => r.majstorId);
  },
};

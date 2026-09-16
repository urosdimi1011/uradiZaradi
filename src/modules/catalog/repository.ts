import "server-only";

import type { CategoryModel, ServiceTypeModel } from "@/generated/prisma/models";
import { db } from "@/lib/db";
import type { Category, ServiceType } from "./domain";

/**
 * Pristup katalogu zanata i usluga.
 *
 * Katalog je admin-kontrolisan i menja se retko, a čita se na svakoj stranici —
 * prvi je kandidat za keširanje kad zatreba. Zasad ide direktno u bazu, jer je
 * reč o devet kategorija i tridesetak usluga.
 */

function toCategory(row: CategoryModel): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: { latn: row.nameLatn, cyrl: row.nameCyrl },
    nameSingular: { latn: row.nameSingularLatn, cyrl: row.nameSingularCyrl },
    icon: row.icon,
    intro: { latn: row.introLatn, cyrl: row.introCyrl },
    // Domen razlikuje „nema vrednosti" (undefined) od baze koja pamti NULL.
    seo: {
      title: row.seoTitle ?? undefined,
      description: row.seoDescription ?? undefined,
    },
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

function toServiceType(row: ServiceTypeModel): ServiceType {
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.categoryId,
    name: { latn: row.nameLatn, cyrl: row.nameCyrl },
    defaultUnit: row.defaultUnit,
    allowedUnits: row.allowedUnits,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export const catalogRepository = {
  async listCategories(): Promise<Category[]> {
    const rows = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toCategory);
  },

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    const row = await db.category.findFirst({ where: { slug, isActive: true } });
    return row ? toCategory(row) : null;
  },

  async findCategoryById(id: string): Promise<Category | null> {
    const row = await db.category.findUnique({ where: { id } });
    return row ? toCategory(row) : null;
  },

  async listServiceTypes(categoryId?: string): Promise<ServiceType[]> {
    const rows = await db.serviceType.findMany({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toServiceType);
  },

  /**
   * Usluge za više zanata odjednom.
   *
   * Majstor u praksi retko radi samo jedno — moler koji ne gletuje je izuzetak.
   * Poziv po kategoriji u petlji bi za tri zanata značio tri upita; ovo je
   * jedan, a redosled prati redosled kategorija pa se usluge mogu grupisati
   * onako kako ih je majstor izabrao.
   */
  async listServiceTypesForCategories(categoryIds: string[]): Promise<ServiceType[]> {
    if (categoryIds.length === 0) return [];

    const rows = await db.serviceType.findMany({
      where: { isActive: true, categoryId: { in: categoryIds } },
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    });
    return rows.map(toServiceType);
  },

  async findServiceTypeById(id: string): Promise<ServiceType | null> {
    const row = await db.serviceType.findUnique({ where: { id } });
    return row ? toServiceType(row) : null;
  },
};

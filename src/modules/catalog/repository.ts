import "server-only";
import { db } from "@/data";
import type { Category, ServiceType } from "./domain";

/**
 * Repository je jedina granica koja zna odakle podaci dolaze.
 * U Fazi 1 telo svake funkcije prelazi na Prisma upit, potpisi ostaju isti.
 */
export const catalogRepository = {
  async listCategories(): Promise<Category[]> {
    return db.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    return db.categories.find((c) => c.slug === slug && c.isActive) ?? null;
  },

  async findCategoryById(id: string): Promise<Category | null> {
    return db.categories.find((c) => c.id === id) ?? null;
  },

  async listServiceTypes(categoryId?: string): Promise<ServiceType[]> {
    return db.serviceTypes
      .filter((s) => s.isActive && (categoryId ? s.categoryId === categoryId : true))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async findServiceTypeById(id: string): Promise<ServiceType | null> {
    return db.serviceTypes.find((s) => s.id === id) ?? null;
  },
};

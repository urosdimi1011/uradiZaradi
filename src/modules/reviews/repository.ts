import "server-only";
import { db } from "@/data";
import type { Review } from "./domain";

export const reviewRepository = {
  /** Javno se nikad ne vraćaju PENDING/REJECTED/HIDDEN recenzije. */
  async listPublished(majstorId: string, limit?: number): Promise<Review[]> {
    const items = db.reviews
      .filter((r) => r.majstorId === majstorId && r.status === "PUBLISHED")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? items.slice(0, limit) : items;
  },

  /** Red za moderaciju — koristi ga admin panel u Fazi 1. */
  async listPending(): Promise<Review[]> {
    return db.reviews
      .filter((r) => r.status === "PENDING")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },
};

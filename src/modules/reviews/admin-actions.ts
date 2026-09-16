"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/session";
import { reviewRepository } from "./repository";

/**
 * Moderacija recenzija.
 *
 * Provera uloge je OVDE, u akciji, ne samo na stranici. Sakriven ekran nije
 * zaštita — akcija se može pozvati i bez njega.
 */
export async function moderirajRecenzijuAction(
  reviewId: string,
  odluka: "odobri" | "odbij",
): Promise<{ ok: boolean; greska?: string }> {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return { ok: false, greska: "Nemate pristup." };

  await reviewRepository.postaviStatus(
    reviewId,
    odluka === "odobri" ? "PUBLISHED" : "REJECTED",
    user.id,
  );

  /*
   * Odobrena recenzija menja prosek majstora, a prosek stoji na kartici u
   * listingu i u pretrazi — zato ceo layout, ne samo ova stranica.
   */
  revalidatePath("/", "layout");

  return { ok: true };
}

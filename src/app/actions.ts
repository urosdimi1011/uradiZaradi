"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SCRIPT_COOKIE, type Script } from "@/lib/script";
import { revealPhone } from "@/modules/majstori/service";

/** Prebacivanje pisma. Cookie, ne URL segment — isti URL mora da radi na oba pisma. */
export async function setScript(next: Script) {
  const store = await cookies();
  store.set(SCRIPT_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

/**
 * Broj telefona se ne šalje sa stranicom nego tek na klik.
 *
 * Tri razloga, svaki dovoljan sam za sebe:
 *  1. scraperi ne pokreću Server Actions, pa brojevi ne završe u tuđoj bazi,
 *  2. klik je merljiv signal namere — to je lead, i to je ono što se kasnije naplaćuje,
 *  3. majstor u statistici vidi koliko ljudi ga je stvarno zvalo.
 *
 * U Fazi 1 se ovde dodaje rate limiting po IP-u i upis u `phone_reveals`.
 */
export async function revealPhoneAction(slug: string): Promise<string | null> {
  return revealPhone(slug);
}

import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "USER" | "MAJSTOR" | "ADMIN";
};

/**
 * Trenutno prijavljen korisnik, ili `null`.
 *
 * Omotano u `cache()` — zaglavlje, stranica i više komponenti u istom renderu
 * traže korisnika, a bez toga bi svaki poziv značio novi upit nad `Session`
 * tabelom. `cache` traje koliko i jedan zahtev, pa nema rizika od curenja
 * sesije između korisnika.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = session.user as typeof session.user & {
    role?: string;
    status?: string;
  };

  /*
   * Banovan korisnik ima važeću sesiju sve dok je admin ne obriše. Provera
   * ovde je druga brava: čak i ako sesija preživi, aplikacija ga vidi kao
   * odjavljenog.
   */
  if (user.status === "BANNED") return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    avatarUrl: user.image ?? null,
    role: (user.role as CurrentUser["role"]) ?? "USER",
  };
});

/** Za stranice koje bez prijave nemaju smisla. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("NEAUTORIZOVAN");
  return user;
}

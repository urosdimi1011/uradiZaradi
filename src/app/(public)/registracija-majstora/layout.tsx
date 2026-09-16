import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Registracija majstora",
  description:
    "Napravite profil majstora, izaberite usluge koje radite i pojavite se u pretrazi kod ljudi kojima treba vaš zanat.",
  /* Popunjavanje profila nema šta da radi u pretrazi — a i traži prijavu. */
  robots: { index: false, follow: false },
};

/**
 * Okvir čarobnjaka.
 *
 * Prijava se traži OVDE, jednom za sve korake, umesto u svakoj stranici posebno
 * — jedan zaboravljen `redirect` u jednom koraku bio bi rupa kroz koju se piše
 * u tuđi profil.
 *
 * Gost se ne odbija nego se šalje na registraciju sa već izabranom ulogom
 * majstora, pa se posle nje vraća ovamo. „Nemate pristup" bi bio kraj puta za
 * čoveka koji je kliknuo „Postanite majstor".
 */
export default async function WizardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/registracija?uloga=majstor");

  return (
    <div className="page-container py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}

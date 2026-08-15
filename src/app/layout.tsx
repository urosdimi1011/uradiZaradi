import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { getScript, SCRIPT_LANG } from "@/lib/script";
import { IS_DEMO } from "@/lib/site";
import "./globals.css";

/** Inter pokriva i latinicu i ćirilicu — jedan font za oba pisma, bez FOUT-a pri prebacivanju. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://uradizaradi.rs"),
  title: {
    default: "Uradi zaradi — pronađite proverenog majstora",
    template: "%s | Uradi zaradi",
  },
  description:
    "Moleri, električari, vodoinstalateri, keramičari i drugi majstori sa proverenim recenzijama i jasnim cenama po m², satu ili komadu.",
  robots: IS_DEMO ? { index: false, follow: false } : undefined,
};

/**
 * Koren drži samo <html>, <body>, font i globalne metapodatke — ništa vizuelno.
 *
 * Zaglavlje i podnožje su namerno spušteni u `(public)/layout.tsx`: admin panel
 * ih ne sme naslediti, a ovde bi ih dobio.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const script = await getScript();

  return (
    <html lang={SCRIPT_LANG[script]} className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

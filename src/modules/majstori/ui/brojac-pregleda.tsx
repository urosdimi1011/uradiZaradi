"use client";

import { useEffect } from "react";

import { zabeleziPregledAction } from "@/modules/majstori/statistika";

/** Ključ u `sessionStorage` — po profilu, da se ne sudaraju. */
const kljuc = (majstorId: string) => `pregled:${majstorId}`;

/**
 * Broji jedan pregled profila.
 *
 * Ne prikazuje ništa. Postoji samo da bi se brojanje desilo u PRAVOM
 * pretraživaču — robot ne izvršava JavaScript, pa ne ulazi u statistiku.
 *
 * `sessionStorage`, ne kolačić: podatak ne treba serveru i ne mora da putuje uz
 * svaki zahtev. Traje koliko i kartica — ko se vrati sutra, broji se opet, što
 * je i pošteno.
 */
export function BrojacPregleda({ majstorId }: { majstorId: string }) {
  useEffect(() => {
    /*
     * Prazan niz zavisnosti nije dovoljan: React u razvoju montira komponentu
     * dvaput. Zato odluku donosi `sessionStorage`, a ne broj poziva efekta.
     */
    try {
      if (sessionStorage.getItem(kljuc(majstorId))) return;
      sessionStorage.setItem(kljuc(majstorId), "1");
    } catch {
      /* Privatni prozor ili zabranjeno skladište — bolje izbrojati nego pasti. */
    }

    /* Greška u brojanju ne sme da obori stranicu — statistika nije sadržaj. */
    void zabeleziPregledAction(majstorId).catch(() => undefined);
  }, [majstorId]);

  return null;
}

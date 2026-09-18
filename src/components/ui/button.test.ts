import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

/**
 * Spajanje klasa dugmeta.
 *
 * `cn` ide kroz `tailwind-merge`, koji NAMERNO izbacuje klase iz iste grupe —
 * tako `h-12` sa poziva pobeđuje `h-13` iz veličine. Ista ta osobina ume i da
 * pojede klasu koju smo hteli da zadržimo, a to se ne vidi ni u tipovima ni u
 * build-u: dugme se samo iscrta u pogrešnoj meri.
 *
 * Ovi testovi zaključavaju tačno ono na čemu stoje forme recenzije i čarobnjaka:
 * visina jednaka poljima (48px) i puna širina samo na telefonu.
 */

/* Iste vrednosti kao u `button.tsx` — veličina `lg`. */
const VELICINA_LG = "h-13 px-6 text-base rounded-[var(--radius-control)]";

describe("visina dugmeta", () => {
  it("h-12 sa poziva pobeđuje h-13 iz veličine", () => {
    const klase = cn(VELICINA_LG, "h-12 sm:w-56");
    expect(klase).toContain("h-12");
    expect(klase).not.toContain("h-13");
  });

  it("polja u formama su h-12, pa dugme mora da bude isto", () => {
    /* Ako se ova vrednost promeni u `field.tsx`, ovaj test treba da padne. */
    expect(cn("h-13", "h-12")).toBe("h-12");
  });
});

describe("širina dugmeta", () => {
  it("puna širina i mera od sm preživljavaju zajedno", () => {
    const klase = cn(VELICINA_LG, "w-full", "h-12 sm:w-56");
    expect(klase).toContain("w-full");
    expect(klase).toContain("sm:w-56");
  });

  it("različiti prelomi se ne potiru", () => {
    const klase = cn("w-full", "sm:w-48");
    expect(klase).toContain("w-full");
    expect(klase).toContain("sm:w-48");
  });

  it("ista grupa na ISTOM prelomu se potire — poslednja pobeđuje", () => {
    expect(cn("sm:w-48", "sm:w-56")).toBe("sm:w-56");
  });

  it("redosled je bitan: klasa sa poziva ide posle veličine", () => {
    /* Obrnut redosled bi značio da veličina pobeđuje i da `h-12` nema efekta. */
    expect(cn("h-12", VELICINA_LG)).toContain("h-13");
  });
});

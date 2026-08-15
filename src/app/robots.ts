import type { MetadataRoute } from "next";
import { abs, IS_DEMO } from "@/lib/site";

/**
 * AI crawleri su namerno DOZVOLJENI (kad demo režim prestane).
 *
 * Trade-off je svestan: sadržaj se daje besplatno modelima. Ali cilj platforme je
 * da bude preporučena kad neko pita „ko je dobar moler u Beogradu" — a to se ne
 * može desiti ako botovima zabranimo pristup. Konkurencija u Srbiji ovo trenutno
 * ne radi, pa je to prednost dok traje.
 */
const AI_CRAWLERS = ["GPTBot", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  if (IS_DEMO) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Pretraga sa parametrima pravi beskonačan prostor URL-ova i troši crawl budžet.
        disallow: ["/pretraga", "/api/", "/admin/", "/*?strana=", "/*?sort="],
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}

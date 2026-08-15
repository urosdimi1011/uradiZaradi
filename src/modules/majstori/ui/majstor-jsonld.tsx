import { EUR_RATE } from "@/lib/format";
import { abs, SITE_NAME } from "@/lib/site";
import type { MajstorDetailView } from "@/modules/majstori/service";

/**
 * Structured data za profil majstora.
 *
 * Isti JSON-LD radi dvostruko: Google iz njega crta rich result sa zvezdicama,
 * a AI crawleri (GPTBot, ClaudeBot, PerplexityBot) iz njega izvlače činjenice
 * kad neko pita „ko je dobar moler u Beogradu". Zato ovde ide i cenovnik,
 * ne samo ime i ocena.
 *
 * AggregateRating se emituje SAMO kad postoje stvarne recenzije — lažiranje ovog
 * polja je jedan od retkih načina da se zaradi ručna kazna od Google-a.
 */
export function MajstorJsonLd({ majstor }: { majstor: MajstorDetailView }) {
  const url = abs(`/majstor/${majstor.slug}`);

  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name: majstor.displayName,
    url,
    image: majstor.avatarUrl ?? undefined,
    description: majstor.bio,
    address: {
      "@type": "PostalAddress",
      addressLocality: majstor.cityLabel.latn,
      addressRegion: majstor.municipalityLabel?.latn,
      addressCountry: "RS",
    },
    areaServed: majstor.cityLabel.latn,
    knowsAbout: majstor.categoryLabel.latn,
    ...(majstor.ratingSummary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: majstor.ratingSummary.average.toFixed(1),
            reviewCount: majstor.ratingSummary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    review: majstor.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorDisplayName },
      datePublished: r.createdAt.toISOString().slice(0, 10),
      reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${majstor.categoryLabel.latn} — usluge i cene`,
      itemListElement: majstor.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.label.latn },
        ...(s.price.amountMinor !== null
          ? {
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: Math.round(s.price.amountMinor / 100),
                priceCurrency: "RSD",
                unitText: s.price.unit,
              },
              // Informativna evro vrednost — tržišna navika je u evrima.
              eligibleQuantity: {
                "@type": "QuantitativeValue",
                unitText: s.price.unit,
              },
              description: `≈ ${Math.round(s.price.amountMinor / 100 / EUR_RATE)} EUR`,
            }
          : { availability: "https://schema.org/InStock" }),
      })),
    },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: abs("/") },
      { "@type": "ListItem", position: 2, name: majstor.categoryLabel.latn, item: abs("/") },
      { "@type": "ListItem", position: 3, name: majstor.displayName, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  );
}

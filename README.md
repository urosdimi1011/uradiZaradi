# Уради заради

Marketplace koji povezuje korisnike sa proverenim majstorima u Srbiji.

**Trenutni status: Faza 0 — demo za klijenta.** Podaci su izmišljeni, ceo sajt je zatvoren za indeksiranje.

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:3000
```

| Skripta | Šta radi |
|---|---|
| `npm run dev` | razvojni server |
| `npm run build` | produkcioni build |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed` | regeneriše demo podatke u `src/data/*.json` |

## Arhitektura

Next.js monolit sa modularnim slojevima. Nema odvojenog backend servisa — vidi
[docs/domain-model.md](docs/domain-model.md) za obrazloženje.

```
src/
  app/                    rute (App Router), Server Components
  components/             UI primitivi i layout, bez domenskog znanja
  data/                   JSON seed + Zod validacija (nestaje u Fazi 1)
  lib/                    cn, format, script, translit, dictionary, site
  modules/
    <domen>/
      domain/             Zod šeme i biznis pravila — ne znaju za HTTP ni React
      repository.ts       jedini sloj koji zna odakle podaci dolaze
      service.ts          use-case funkcije, vraćaju view modele
      ui/                 komponente vezane za domen
```

**Pravilo:** Server Components i Server Actions zovu `service` direktno, bez HTTP hopa.
UI nikad ne prima sirov domenski entitet — samo view model iz `service`.

Kad zatreba mobilna aplikacija ili treći klijent, dodaje se `/api/v1/*` kao tanak
omotač oko istih `service` funkcija.

## Pismo

Latinica je izvor istine i default. Ćirilica je pun sekundarni prikaz:

- statički UI tekstovi imaju ručni par u [src/lib/dictionary.ts](src/lib/dictionary.ts)
- korisnički sadržaj (opis majstora, recenzije, imena) se transliteruje u letu
  preko [src/lib/translit.ts](src/lib/translit.ts)
- **URL-ovi i slugovi su uvek latinični**, na oba pisma
- prebacivanje ide preko cookie-ja `pismo`, ne preko URL segmenta

Razlog: pretraga na Google-u u Srbiji je pretežno latinična. Ćirilica kao primarna
bi nas koštala većine organskog saobraćaja.

## Šta je već ugrađeno za SEO/GEO

- `robots.txt` — u demo režimu zabranjuje sve; u produkciji eksplicitno dozvoljava
  GPTBot, ClaudeBot, PerplexityBot i Google-Extended
- `sitemap.xml` — generiše se iz podataka, preskače kombinacije ispod praga kvaliteta
- `llms.txt` — strukturiran opis kategorija sa mernim jedinicama, za jezičke modele
- JSON-LD na profilu: `LocalBusiness`, `AggregateRating`, `Review`, `OfferCatalog`, `BreadcrumbList`
- `noindex` za profile ispod praga (`isMajstorIndexable`)
- forme rade bez JavaScripta i daju deljive URL-ove

## Demo podaci

`src/data/*.json` generiše [scripts/generate-seed.mjs](scripts/generate-seed.mjs).
Fajlovi se validiraju Zod šemama pri učitavanju — ako seed odstupi od modela, build pukne.

Placeholder slike dolaze sa `i.pravatar.cc` (portreti) i `picsum.photos` (radovi).
**Pre prikaza klijentu proveriti da li portreti odgovaraju imenima** — pravatar
ne garantuje pol lica po ID-ju. Zamena: `avatarUrl` u seed skripti.

## Pre prelaska u Fazu 1

- `NEXT_PUBLIC_SITE_IS_DEMO=false` skida globalni `noindex`
- `NEXT_PUBLIC_SITE_URL` mora da pokazuje na pravi domen
- `remotePatterns` u [next.config.ts](next.config.ts) se briše i zamenjuje sopstvenim bucket-om
- `src/data/` nestaje, `repository.ts` fajlovi prelaze na Prisma upite

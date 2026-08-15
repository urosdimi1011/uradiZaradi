# Domenski model — Уради заради

Ovaj dokument je ugovor. Sve dalje (JSON seed, UI, kasnije Prisma šema) izvedeno je odavde.
Zod šeme u `src/modules/*/domain/` su izvršna verzija ovog dokumenta — ako se njih dvoje razilaze, šeme su u pravu.

## Principi

1. **Jezik domena je srpski.** Entitet se zove `Majstor`, ne `Craftsman`. Prevođenje domenskih pojmova pravi trajnu konfuziju u timu.
2. **Latinica je izvor istine.** Svaki korisnički vidljiv tekst je `{ latn, cyrl }`. URL-ovi su uvek latinični, na oba pisma.
3. **Domen ne zna za HTTP ni za React.** Server Components i Server Actions zovu `service` sloj direktno; `repository` je jedini koji zna odakle podaci dolaze.
4. **Novac u minor jedinicama, valuta RSD.** Nikad float.

## Struktura modula

```
src/modules/
  shared/domain/primitives.ts   slug, LocalizedText, Money, SeoMeta, timestamp
  geo/domain/                   City, Municipality
  catalog/domain/               PriceUnit, Category, ServiceType, ServiceTypeProposal
  users/domain/                 User, UserRole, UserStatus
  majstori/domain/              Majstor, MajstorService, WorkPhoto, RatingSummary, VerificationLevel
  reviews/domain/               Review, ReviewReply, bayesianScore()
  promotions/domain/            Promotion, PromotionPlacement, rankingWeights
```

Svaki modul dobija `service/`, `repository/` i `ui/` u sledećim koracima.

## Entiteti i veze

```
User 1──1 Majstor            nalog je odvojen od profila (firma sa više majstora kasnije)
Majstor n──1 Category        primarna kategorija + categoryIds[] za višestruke
Majstor 1──n MajstorService  ──n──1 ServiceType ──n──1 Category
Majstor 1──n WorkPhoto
Majstor 1──n Review          ──n──1 User (autor), unique(majstorId, authorUserId)
Majstor 1──n Promotion
Majstor n──1 City, n──0..1 Municipality, n──n servesCityIds[]
```

## Tri odluke koje nose ceo model

### 1. Merna jedinica pripada `ServiceType`, ne kategoriji

Moler farba zidove po m², ali montira karnišu po komadu — jedinica po kategoriji ne radi.
Slobodan unos majstora takođe ne radi: za tri meseca dobiješ 40 varijanti istog naziva usluge, i pretraga i agregacija cena („prosečna cena krečenja u Beogradu") se raspadnu. Baš ta agregacija je najvredniji SEO/GEO sadržaj koji sajt može da ima.

Katalog je admin-kontrolisan. `ServiceTypeProposal` je ventil: majstor predloži, admin odobri, katalog raste organski a ostaje čist.

Jedinice: `M2 | M1 | SAT | DAN | KOMAD | PO_DOGOVORU`.
Cena je uvek `priceFrom` („Од 8€/m²" sa mockupa), `null` znači po dogovoru.

### 2. Verifikacija je stepenasta, kvačica je nivo `IDENTITY`

| Nivo | Šta dokazuje | Javno |
|---|---|---|
| `EMAIL` | nalog je dosežan | — |
| `PHONE` | poseduje broj telefona (SMS OTP) | siva oznaka |
| `IDENTITY` | admin proverio lice ili firmu (PIB / matični broj) | **žuta kvačica** |

SMS OTP ne dokazuje da je neko majstor — dokazuje da ima telefon. U MVP-u `IDENTITY` dodeljuje admin ručno, pozivom. Nula troška po gatewayu, a jači marketinški argument: „svaki majstor je lično proveren".

### 3. Sortiranje ide po Bayesian proseku, nikad po sirovom

```
score = (v/(v+m)) * R + (m/(v+m)) * C     m = 10
```

Bez ovoga majstor sa jednom peticom preskače onog sa 4.9 i 127 recenzija.
Redosled na listingu: `promovisani DESC, bayesianScore DESC`. Promovisana mesta moraju biti vidljivo označena — i zbog poverenja i zbog Zakona o oglašavanju.

## Zaštita od thin contenta

Profil ide u `noindex` dok ne ispuni prag: opis ≥ 200 karaktera, ≥ 3 fotografije, ≥ 1 usluga, status `ACTIVE` (`isMajstorIndexable`).
Isto važi za kategorija×grad stranice sa manje od 3 majstora.

Stotine šablonskih profila su najbrži način da marketplace ubije sopstveni domen u Google-u. `profileCompleteness()` pokreće progress bar koji tera majstore da pišu svoj tekst.

## URL struktura (SEO motor)

| Ruta | Namena |
|---|---|
| `/` | početna |
| `/moleri-beograd` | **kategorija × grad — glavni izvor saobraćaja** |
| `/moleri-beograd/zvezdara` | kategorija × opština |
| `/moleri` | kategorija, nacionalno |
| `/majstor/marko-petrovic-moler-beograd` | profil |
| `/usluge/farbanje-zidova-cena` | „cena" upiti, veliki volumen |
| `/pretraga?...` | pretraga, `noindex` |

Ćirilična varijanta: isti URL-ovi, `hreflang` `sr-Latn-RS` / `sr-Cyrl-RS`, prekidač pisma u headeru.

## Otvorena pitanja za klijenta

1. **Valuta.** Mockup je u €. Oglašavanje cena u evrima je pravno klimavo u Srbiji — model čuva RSD, € se prikazuje informativno. Treba potvrda.
2. **Telefon.** Prikazuje se odmah ili iza „Prikaži broj"? Preporuka: iza klika — sprečava scrapovanje i daje merljiv signal namere (i osnovu za naplatu po lead-u kasnije).
3. **Ko sme da ocenjuje.** Trenutno: svaki nalog sa potvrđenim mejlom, uz moderaciju. Alternativa je zahtevati i potvrđen telefon — manje lažnih recenzija, ali i manje recenzija.

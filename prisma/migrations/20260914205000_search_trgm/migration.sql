-- Trigram indeks nad `searchText`.
--
-- Bez njega upit `searchText LIKE '%moler%'` mora da pročita svaki red: vodeći
-- wildcard onemogućava običan B-tree indeks. GIN + pg_trgm to rešava i drži
-- pretragu brzom i na desetinama hiljada profila.
--
-- Prisma ne opisuje trigram operator klase u šemi, pa indeks ide ručno.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Majstor_searchText_trgm_idx"
  ON "Majstor" USING GIN ("searchText" gin_trgm_ops);

-- Sačuvani majstor pripada ILI nalogu ILI uređaju — nikad oboje, nikad nijedno.
-- Prisma ne zna za CHECK ograničenja, a ovo je pravilo koje aplikacija ne sme
-- da prekrši ni greškom: red bez vlasnika bio bi nevidljiv i neobrisiv.
ALTER TABLE "SavedMajstor"
  ADD CONSTRAINT "SavedMajstor_owner_check"
  CHECK (("userId" IS NOT NULL) <> ("deviceId" IS NOT NULL));

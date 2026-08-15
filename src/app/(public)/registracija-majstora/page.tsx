import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, Mail, Phone, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, InputWithIcon, Label, Select, Textarea } from "@/components/ui/field";
import { catalogRepository } from "@/modules/catalog/repository";
import { geoRepository } from "@/modules/geo/repository";
import { CategoryIcon } from "@/modules/catalog/ui/category-icon";
import { PRICE_UNIT_LABEL } from "@/modules/catalog/domain";
import { INDEXABILITY_THRESHOLD } from "@/modules/majstori/domain";
import { makeT } from "@/lib/dictionary";
import { getScript, t as pick } from "@/lib/script";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Registracija majstora",
  description:
    "Napravite profil majstora, izaberite usluge koje radite i pojavite se u pretrazi kod ljudi kojima treba vaš zanat.",
  robots: { index: false, follow: false },
};

/** Prva kategorija služi kao primer u demou — pravi tok bira korisnik u koraku 2. */
const DEMO_CATEGORY_SLUG = "moleri";

export default async function MajstorRegistrationPage() {
  const script = await getScript();
  const t = makeT(script);

  const [categories, cities] = await Promise.all([
    catalogRepository.listCategories(),
    geoRepository.listCities(),
  ]);

  const demoCategory =
    (await catalogRepository.findCategoryBySlug(DEMO_CATEGORY_SLUG)) ?? categories[0];
  const services = demoCategory ? await catalogRepository.listServiceTypes(demoCategory.id) : [];
  const municipalities = await geoRepository.listMunicipalities("beograd");

  const steps = [
    { key: "stepAccount", icon: User, done: false, active: true },
    { key: "stepProfession", icon: BadgeCheck, done: false, active: false },
    { key: "stepProfile", icon: Check, done: false, active: false },
    { key: "stepVerification", icon: ShieldCheck, done: false, active: false },
  ] as const;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-2xl font-semibold text-content-primary sm:text-3xl">
        {t("majstorRegTitle")}
      </h1>
      <p className="mt-2 max-w-xl text-content-secondary">{t("majstorRegLead")}</p>

      {/* ── Koraci ── */}
      <ol className="no-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                step.active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-line bg-surface-card text-content-muted",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "truncate text-sm",
                step.active ? "font-medium text-content-primary" : "text-content-muted",
              )}
            >
              {t(step.key)}
            </span>
            {i < steps.length - 1 ? (
              <span className="hidden h-px flex-1 bg-line sm:block" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      <form className="mt-7 flex flex-col gap-5">
        <Card>
          <CardHeader title={t("stepAccount")} />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ime">{t("fullName")}</Label>
              <InputWithIcon
                id="ime"
                name="ime"
                icon={<User width={17} height={17} aria-hidden />}
                autoComplete="name"
                placeholder="Marko Petrović"
              />
            </div>
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <InputWithIcon
                id="email"
                name="email"
                type="email"
                icon={<Mail width={17} height={17} aria-hidden />}
                autoComplete="email"
                placeholder="marko@primer.rs"
              />
            </div>
            <div>
              <Label htmlFor="telefon">{t("phone")}</Label>
              <InputWithIcon
                id="telefon"
                name="telefon"
                type="tel"
                icon={<Phone width={17} height={17} aria-hidden />}
                autoComplete="tel"
                placeholder="+381 6x xxx xxxx"
              />
              <p className="mt-1.5 text-xs text-content-muted">
                {script === "cyrl"
                  ? "Број се не приказује јавно док посетилац не кликне „Прикажи број”."
                  : "Broj se ne prikazuje javno dok posetilac ne klikne „Prikaži broj”."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="grad">{t("city")}</Label>
                <Select id="grad" name="grad" defaultValue="beograd">
                  {cities.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {pick(c.name, script)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="opstina">{t("municipality")}</Label>
                <Select id="opstina" name="opstina">
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.slug}>
                      {pick(m.name, script)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("chooseCategory")} />
          <CardBody>
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {categories.map((c) => (
                <li key={c.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-control)] border p-3 text-center transition-colors",
                      c.id === demoCategory?.id
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-line bg-surface-input text-content-secondary hover:border-line-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="kategorija"
                      value={c.slug}
                      defaultChecked={c.id === demoCategory?.id}
                      className="sr-only"
                    />
                    <CategoryIcon name={c.icon} size={20} />
                    <span className="text-[11px] leading-tight">{pick(c.name, script)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/*
          Ovaj blok je razlog zbog kog merna jedinica pripada usluzi, a ne majstoru.
          Majstor bira uslugu iz kataloga i upisuje SAMO cenu — jedinica je već određena.
          Posledica: cene su uporedive među majstorima, pa je moguće izračunati
          „prosečna cena krečenja u Beogradu", što je najvredniji SEO sadržaj na sajtu.
        */}
        <Card>
          <CardHeader title={t("chooseServices")} />
          <CardBody>
            <ul className="divide-y divide-line">
              {services.map((s, i) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="usluge"
                      value={s.slug}
                      defaultChecked={i < 3}
                      className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    <span className="text-sm text-content-primary">{pick(s.name, script)}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Input
                      name={`cena-${s.slug}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder={t("from")}
                      className="h-10 w-28 text-sm"
                      aria-label={`${t("price")} — ${s.name.latn}`}
                      disabled={s.defaultUnit === "PO_DOGOVORU"}
                    />
                    <span className="w-24 shrink-0 text-xs text-content-muted">
                      {s.defaultUnit === "PO_DOGOVORU" ? (
                        <strong className="font-medium text-content-secondary">
                          {pick(PRICE_UNIT_LABEL.PO_DOGOVORU, script)}
                        </strong>
                      ) : (
                        <>
                          RSD /{" "}
                          <strong className="font-medium text-content-secondary">
                            {pick(PRICE_UNIT_LABEL[s.defaultUnit], script)}
                          </strong>
                        </>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-content-muted">
              {script === "cyrl"
                ? "Мерну јединицу одређује врста услуге — тако су цене упоредиве међу мајсторима."
                : "Mernu jedinicu određuje vrsta usluge — tako su cene uporedive među majstorima."}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("aboutYou")} />
          <CardBody>
            <Textarea
              name="opis"
              minLength={INDEXABILITY_THRESHOLD.minBioLength}
              placeholder={
                script === "cyrl"
                  ? "Чиме се бавите, колико дуго, шта вас издваја…"
                  : "Čime se bavite, koliko dugo, šta vas izdvaja…"
              }
            />
            <p className="mt-2 text-xs text-content-muted">{t("aboutYouHint")}</p>

            {/*
              Progress bar nije ukras. Profil ispod praga kvaliteta ide u noindex,
              pa je ovo mehanizam kojim se majstor tera da napiše sopstveni tekst
              umesto da ostavi šablon — a šabloni su ono što ubija SEO marketplace-a.
            */}
            <div className="mt-5 rounded-[var(--radius-control)] border border-line bg-surface-input p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-content-secondary">{t("profileCompleteness")}</span>
                <span className="font-semibold text-brand tabular-nums">40%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full w-[40%] rounded-full bg-brand" />
              </div>
              <p className="mt-2.5 text-xs text-content-muted">
                {script === "cyrl"
                  ? `Профил постаје видљив у претрази када има опис од ${INDEXABILITY_THRESHOLD.minBioLength} карактера, најмање ${INDEXABILITY_THRESHOLD.minGalleryPhotos} фотографије рада и бар једну услугу.`
                  : `Profil postaje vidljiv u pretrazi kada ima opis od ${INDEXABILITY_THRESHOLD.minBioLength} karaktera, najmanje ${INDEXABILITY_THRESHOLD.minGalleryPhotos} fotografije rada i bar jednu uslugu.`}
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-content-muted">
            {script === "cyrl"
              ? "Наставком прихватате услове коришћења и политику приватности."
              : "Nastavkom prihvatate uslove korišćenja i politiku privatnosti."}
          </p>
          <Button type="submit" size="lg" className="sm:w-48">
            {t("continue")}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-content-secondary">
        {script === "cyrl" ? "Већ имате налог?" : "Već imate nalog?"}{" "}
        <Link href="/prijava" className="font-medium text-brand hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}

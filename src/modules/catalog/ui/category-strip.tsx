import Link from "next/link";

import type { Category } from "@/modules/catalog/domain";
import { CategoryIcon } from "@/modules/catalog/ui/category-icon";
import { ScrollActiveIntoView } from "@/modules/catalog/ui/scroll-active-into-view";
import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import { t as pick, type Script } from "@/lib/script";

const STRIP_ID = "traka-kategorija";

/**
 * Horizontalna traka kategorija sa mockupa. Na mobilnom skroluje, na desktopu se
 * prelama u red. Linkovi su pravi `<a>` elementi, ne dugmad sa onClick —
 * crawler mora da može da prošeta kroz sve kategorije.
 */
export function CategoryStrip({
  categories,
  activeSlug,
  script,
  visibleCount = 8,
}: {
  categories: Category[];
  activeSlug?: string;
  script: Script;
  visibleCount?: number;
}) {
  const t = makeT(script);

  /*
   * Izabrana kategorija MORA da bude u traci, čak i kad ispada iz prvih
   * `visibleCount`. Bez ovoga bi izbor „Parketara" (devetih po redu) dao traku
   * u kojoj se nigde ne vidi šta je izabrano — a to je gore od skrolovanja.
   */
  const head = categories.slice(0, visibleCount);
  const activeOutside =
    activeSlug && !head.some((c) => c.slug === activeSlug)
      ? categories.find((c) => c.slug === activeSlug)
      : undefined;

  const visible = activeOutside ? [...head, activeOutside] : head;
  const hasMore = categories.length > visible.length;

  return (
    <nav aria-label={t("allCategories")}>
      <ScrollActiveIntoView containerId={STRIP_ID} activeKey={activeSlug ?? ""} />

      <ul
        id={STRIP_ID}
        className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-6 sm:px-0 lg:flex-wrap lg:justify-start lg:overflow-visible"
      >
        <CategoryItem
          href="/"
          icon="LayoutGrid"
          label={t("allCategories")}
          active={!activeSlug}
        />
        {visible.map((c) => (
          <CategoryItem
            key={c.id}
            href={`/${c.slug}`}
            icon={c.icon}
            label={pick(c.name, script)}
            active={activeSlug === c.slug}
          />
        ))}
        {hasMore ? (
          <CategoryItem href="/kategorije" icon="MoreHorizontal" label={t("more")} />
        ) : null}
      </ul>
    </nav>
  );
}

function CategoryItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="group flex w-[86px] flex-col items-center gap-2 py-2 text-center"
      >
        <span
          className={cn(
            "grid h-14 w-14 place-items-center rounded-full border transition-colors",
            active
              ? "border-brand bg-brand/10 text-brand"
              : "border-line bg-surface-card text-content-secondary group-hover:border-line-strong group-hover:text-content-primary",
          )}
        >
          <CategoryIcon name={icon} />
        </span>
        <span
          className={cn(
            "text-[11px] leading-tight",
            active ? "font-semibold text-brand" : "text-content-secondary",
          )}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}

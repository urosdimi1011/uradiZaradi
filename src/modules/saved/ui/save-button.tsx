"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

import { prebaciSacuvanoAction } from "@/modules/saved/actions";
import { cn } from "@/lib/cn";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";

/**
 * Srce — čuvanje majstora.
 *
 * `useOptimistic`: srce se popuni ODMAH pri kliku, pre nego što server odgovori.
 * Čuvanje je sitna radnja koju ljudi rade u nizu, listajući rezultate; čekanje
 * od 200ms po kliku se oseti kao da dugme ne radi. Ako upis padne, React vrati
 * pravo stanje sam.
 *
 * Gostu se NE prikazuje dugme nego link ka prijavi, sa adresom sa koje je
 * krenuo. Server ionako zna da nije prijavljen, pa nema razloga da se to
 * otkriva tek posle klika i odlaska na server. Uz to link radi i bez
 * JavaScripta, a dugme koje zove akciju ne bi.
 */
export function SaveButton({
  majstorId,
  sacuvan,
  prijavljen,
  script,
  /** `card` je srce u uglu kartice; `wide` je dugme na profilu. */
  varijanta = "card",
  className,
}: {
  majstorId: string;
  sacuvan: boolean;
  prijavljen: boolean;
  script: Script;
  varijanta?: "card" | "wide";
  className?: string;
}) {
  const t = makeT(script);
  const pathname = usePathname();

  const [uToku, pokreni] = useTransition();
  const [optimisticno, postaviOptimisticno] = useOptimistic(sacuvan);

  function klik() {
    pokreni(async () => {
      postaviOptimisticno(!optimisticno);
      await prebaciSacuvanoAction(majstorId);
    });
  }

  const naziv = optimisticno ? t("savedMajstor") : t("saveMajstor");

  /* `next` govori prijavi gde da vrati čoveka kad završi. */
  const kaPrijavi = `/prijava?next=${encodeURIComponent(pathname)}`;

  if (!prijavljen) {
    return varijanta === "wide" ? (
      <Link
        href={kaPrijavi}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-line-strong text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover",
          className,
        )}
      >
        <Heart width={16} height={16} aria-hidden />
        {t("saveMajstor")}
      </Link>
    ) : (
      <Link href={kaPrijavi} aria-label={t("saveMajstor")} title={t("saveMajstor")} className={className}>
        <Heart width={22} height={22} aria-hidden />
      </Link>
    );
  }

  if (varijanta === "wide") {
    return (
      <button
        type="button"
        onClick={klik}
        disabled={uToku}
        aria-pressed={optimisticno}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border text-sm font-medium transition-colors",
          optimisticno
            ? "border-brand/50 bg-brand/10 text-content-primary"
            : "border-line-strong text-content-primary hover:bg-surface-hover",
          className,
        )}
      >
        <Heart
          width={16}
          height={16}
          aria-hidden
          className={optimisticno ? "fill-brand text-brand" : undefined}
        />
        {naziv}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={klik}
      disabled={uToku}
      aria-pressed={optimisticno}
      aria-label={naziv}
      title={naziv}
      className={className}
    >
      <Heart
        width={22}
        height={22}
        aria-hidden
        className={optimisticno ? "fill-brand text-brand" : undefined}
      />
    </button>
  );
}

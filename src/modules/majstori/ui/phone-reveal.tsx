"use client";

import { useState, useTransition } from "react";
import { Phone } from "lucide-react";

import { revealPhoneAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { makeT } from "@/lib/dictionary";
import { formatPhone } from "@/lib/format";
import type { Script } from "@/lib/script";

/**
 * Glavna akcija na profilu — žuta, kao na mockupu.
 *
 * Maskirani broj se NE prikazuje u početnom stanju: dugme je poziv na akciju
 * ("Pozovite majstora"), a ne pregled podatka. Broj se pojavljuje tek na klik,
 * i tada dugme postaje `tel:` link — jedan dodir na telefonu zove.
 *
 * Sam broj i dalje ne dolazi sa stranicom nego iz Server Action, pa ga scraperi
 * ne pokupe iz HTML-a.
 */
export function PhoneReveal({ slug, script }: { slug: string; script: Script }) {
  const t = makeT(script);
  const [phone, setPhone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (phone) {
    return (
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
      >
        <Phone width={16} height={16} aria-hidden />
        {formatPhone(phone)}
      </a>
    );
  }

  return (
    <Button
      fullWidth
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setPhone(await revealPhoneAction(slug));
        })
      }
    >
      <Phone width={16} height={16} aria-hidden />
      {t("callMajstor")}
    </Button>
  );
}

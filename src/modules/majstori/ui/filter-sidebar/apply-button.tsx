"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { countMajstoriAction } from "@/app/(public)/_listing/actions";
import { cn } from "@/lib/cn";
import styles from "./filter-sidebar.module.css";

/**
 * Dugme koje uživo pokazuje koliko rezultata trenutni filter daje.
 *
 * Bez ovoga korisnik štiklira, primeni, vidi „nema rezultata", pa se vraća u
 * panel da pogađa šta da otkači. Brojka mu unapred kaže da je otišao predaleko.
 *
 * Prati formu preko `id` a ne kroz React state, jer su polja server-renderovana
 * i nekontrolisana — presnimavanje u kontrolisana bi značilo state za svako polje
 * samo da bi se dobio zbir koji ionako računa server.
 */
const DEBOUNCE_MS = 300;

export function ApplyButton({
  formId,
  categorySlug,
  initialTotal,
  label,
  className,
}: {
  formId: string;
  categorySlug: string | null;
  initialTotal: number;
  label: string;
  className?: string;
}) {
  const [total, setTotal] = useState(initialTotal);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    let timer: ReturnType<typeof setTimeout>;

    const recount = () => {
      clearTimeout(timer);
      // Odloženo, da kucanje cene ne pošalje zahtev po svakoj cifri.
      timer = setTimeout(() => {
        const entries = [...new FormData(form).entries()]
          .filter(([, v]) => typeof v === "string")
          .map(([k, v]) => [k, v as string] as [string, string]);

        startTransition(async () => {
          setTotal(await countMajstoriAction(entries, categorySlug));
        });
      }, DEBOUNCE_MS);
    };

    form.addEventListener("change", recount);
    form.addEventListener("input", recount);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("change", recount);
      form.removeEventListener("input", recount);
    };
  }, [formId, categorySlug]);

  return (
    <button
      type="submit"
      form={formId}
      className={cn(className)}
      /* Nula rezultata: dugme ostaje aktivno, ali jasno kaže da vodi u prazno. */
      aria-live="polite"
    >
      {/*
        Dok se broji, spinner ZAMENJUJE tekst umesto da stoji pored njega —
        inače se dugme širi i skuplja pri svakom štikliranju. `1em` ga vezuje
        za veličinu slova, pa ostaje u ravni sa tekstom koji zamenjuje.
      */}
      {pending ? (
        <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
      ) : (
        <span>
          {label} ({total})
        </span>
      )}
    </button>
  );
}

/** Ista logika, stil podnožja modala — da listing ne mora da zna za CSS modul. */
export function DialogApplyButton(props: Omit<Parameters<typeof ApplyButton>[0], "className">) {
  return <ApplyButton {...props} className={styles.dialogApply} />;
}

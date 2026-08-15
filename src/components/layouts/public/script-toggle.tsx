"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setScript } from "@/app/actions";
import type { Script } from "@/lib/script";
import { cn } from "@/lib/cn";

/**
 * Jedina klijentska komponenta u headeru. Sve ostalo je server-rendered
 * jer je indeksabilnost sadržaja ceo smisao ovog projekta.
 */
export function ScriptToggle({ script, className }: { script: Script; className?: string }) {
  const [pending, startTransition] = useTransition();
  const next: Script = script === "latn" ? "cyrl" : "latn";
  const label = script === "latn" ? "Ћир" : "Lat";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setScript(next))}
      aria-label={script === "latn" ? "Prebaci na ćirilicu" : "Prebaci na latinicu"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border border-line px-3 text-xs font-semibold text-content-secondary transition-colors hover:border-brand hover:text-content-primary disabled:opacity-50",
        className,
      )}
    >
      <Languages width={14} height={14} aria-hidden />
      {label}
    </button>
  );
}

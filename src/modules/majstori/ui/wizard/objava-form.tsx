"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { objaviProfilAction, type KorakStanje } from "@/modules/majstori/actions";

/**
 * Dugme za objavu.
 *
 * Akcija ne prima ništa — sve što joj treba već stoji u bazi. Forma postoji
 * samo da bi objava išla POST-om: objava menja stanje, a stanje se ne menja
 * klikom na link.
 */
export function ObjavaForm({ spreman }: { spreman: boolean }) {
  const [state, formAction, pending] = useActionState<KorakStanje, FormData>(
    async () => objaviProfilAction(),
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-danger/45 bg-danger/10 p-3 text-sm text-content-primary"
        >
          <AlertCircle width={16} height={16} aria-hidden className="shrink-0" />
          {state.error}
        </p>
      ) : null}

      {/*
        Verifikacija telefona još ne postoji — nema SMS provajdera. Umesto da se
        objava zbog toga blokira, ovde stoji objašnjenje šta sledi. Uslov se
        kasnije uključuje bez menjanja toka.
      */}
      <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface-raised p-4">
        <ShieldCheck width={18} height={18} aria-hidden className="mt-0.5 shrink-0 text-content-muted" />
        <div>
          <p className="text-sm text-content-primary">Verifikacija broja telefona</p>
          <p className="mt-1 text-xs leading-relaxed text-content-secondary">
            Uskoro ćete moći da potvrdite broj SMS porukom. Verifikovani majstori dobijaju oznaku
            pored imena i prikazuju se više u rezultatima. Profil možete objaviti i bez toga.
          </p>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending || !spreman} className="sm:w-56">
        {pending ? (
          <Loader2 aria-hidden className="h-[1em] w-[1em] animate-spin" />
        ) : (
          "Objavi profil"
        )}
      </Button>
    </form>
  );
}

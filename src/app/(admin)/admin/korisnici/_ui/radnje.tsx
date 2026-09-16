import { LogOut, ShieldBan, ShieldCheck, ShieldAlert } from "lucide-react";

import { odjaviSvudaAction, postaviStatusAction } from "@/modules/admin/actions";
import { AdminForma } from "../../_ui/poruka-akcije";

/**
 * Radnje nad jednim nalogom.
 *
 * Administratorski nalozi ih ne dobijaju: pravilo je u domenu i akcija bi ih
 * svejedno odbila, ali dugme koje uvek odbija uči čoveka da ne čita poruke.
 */
export function RadnjeNadNalogom({
  userId,
  uloga,
  status,
  imaSesije,
}: {
  userId: string;
  uloga: "USER" | "MAJSTOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  imaSesije: boolean;
}) {
  if (uloga === "ADMIN") {
    return (
      <p className="mt-3 text-xs text-content-muted">
        Administratorski nalog — menja se u bazi, ne odavde.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <Dugme
          userId={userId}
          status="ACTIVE"
          ikona={<ShieldCheck width={14} height={14} aria-hidden />}
          tekst="Vrati u rad"
          potvrda="Vratiti nalog u rad? Profil se ponovo prikazuje na sajtu."
        />
      ) : null}

      {status !== "SUSPENDED" ? (
        <Dugme
          userId={userId}
          status="SUSPENDED"
          ikona={<ShieldAlert width={14} height={14} aria-hidden />}
          tekst="Suspenduj"
          potvrda="Suspendovati nalog? Profil se sklanja sa sajta, a nalog se odjavljuje sa svih uređaja. Recenzije ostaju."
        />
      ) : null}

      {status !== "BANNED" ? (
        <Dugme
          userId={userId}
          status="BANNED"
          ikona={<ShieldBan width={14} height={14} aria-hidden />}
          tekst="Banuj"
          opasno
          potvrda="Banovati nalog? Profil se sklanja, nalog odjavljuje, a SVE recenzije koje je napisao prestaju da se prikazuju — ocene majstora se preračunavaju."
        />
      ) : null}

      {imaSesije ? (
        <AdminForma
          akcija={odjaviSvudaAction}
          potvrda="Odjaviti nalog sa svih uređaja? Lozinka ostaje nepromenjena."
        >
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] border border-line-strong px-3 text-xs text-content-primary transition-colors hover:bg-surface-hover"
          >
            <LogOut width={14} height={14} aria-hidden />
            Odjavi svuda
          </button>
        </AdminForma>
      ) : null}
    </div>
  );
}

function Dugme({
  userId,
  status,
  ikona,
  tekst,
  potvrda,
  opasno,
}: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  ikona: React.ReactNode;
  tekst: string;
  potvrda: string;
  opasno?: boolean;
}) {
  return (
    <AdminForma akcija={postaviStatusAction} potvrda={potvrda}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] border px-3 text-xs transition-colors ${
          opasno
            ? "border-danger/50 text-danger hover:bg-danger/10"
            : "border-line-strong text-content-primary hover:bg-surface-hover"
        }`}
      >
        {ikona}
        {tekst}
      </button>
    </AdminForma>
  );
}

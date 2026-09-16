/**
 * Polja admin formi.
 *
 * Namerno bez svoje validacije: pravila stoje u `domain/forme.ts` i proveravaju
 * se na serveru. Ovde je samo `required` i tip, da pretraživač uhvati ono
 * najgrublje pre nego što zahtev uopšte krene.
 */
export function Polje({
  ime,
  naslov,
  podrazumevano,
  nagovestaj,
  tip = "text",
  viseredno,
  obavezno,
  zakljucano,
}: {
  ime: string;
  naslov: string;
  podrazumevano?: string;
  nagovestaj?: string;
  tip?: "text" | "number";
  viseredno?: boolean;
  obavezno?: boolean;
  /** Prikazuje vrednost, ali je ne šalje — za slug postojeće stavke. */
  zakljucano?: boolean;
}) {
  const klase =
    "w-full rounded-[var(--radius-control)] border border-line bg-surface-input px-3 py-2 text-sm text-content-primary disabled:text-content-muted";

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-content-secondary">
        {naslov}
        {obavezno && !zakljucano ? <span className="text-danger"> *</span> : null}
      </span>

      {viseredno ? (
        <textarea
          name={ime}
          defaultValue={podrazumevano}
          required={obavezno}
          rows={4}
          className={klase}
        />
      ) : (
        <input
          type={tip}
          name={zakljucano ? undefined : ime}
          defaultValue={podrazumevano}
          required={obavezno && !zakljucano}
          disabled={zakljucano}
          className={klase}
        />
      )}

      {nagovestaj ? (
        <span className="mt-1 block text-xs text-content-muted">{nagovestaj}</span>
      ) : null}
    </label>
  );
}

export function Prekidac({
  ime,
  naslov,
  opis,
  podrazumevano,
}: {
  ime: string;
  naslov: string;
  opis?: string;
  podrazumevano?: boolean;
}) {
  return (
    <label className="mt-4 flex items-start gap-3 rounded-[var(--radius-control)] border border-line bg-surface-card p-3">
      <input
        type="checkbox"
        name={ime}
        value="1"
        defaultChecked={podrazumevano}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm text-content-primary">{naslov}</span>
        {opis ? <span className="mt-0.5 block text-xs text-content-muted">{opis}</span> : null}
      </span>
    </label>
  );
}

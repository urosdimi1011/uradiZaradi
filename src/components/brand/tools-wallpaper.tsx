/**
 * Pozadinski watermark sa obrisima alata.
 *
 * Ponavljajući `<pattern>`, ne slika: pokriva bilo koju veličinu bez šavova i
 * bez ijednog dodatnog zahteva ka mreži. Kontura je u brend žutoj na ~5%
 * neprozirnosti — dovoljno da se nasluti tekstura, premalo da se takmiči
 * sa tekstom iznad.
 *
 * `aria-hidden` jer je čisto dekorativan; čitač ekrana nema šta da pročita.
 */
export function ToolsWallpaper({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="uz-tools-wallpaper"
          width="260"
          height="260"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Čekić */}
            <g transform="translate(18 18) rotate(-24)">
              <path d="M4 14h44a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H4l-4-11z" />
              <path d="M54 16h10a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H54" />
              <path d="M24 36v52a5 5 0 0 0 10 0V36" />
            </g>

            {/* Ključ */}
            <g transform="translate(150 40) rotate(38)">
              <path d="M20 0a18 18 0 0 1 12 31L32 74a12 12 0 0 1-24 0L8 31A18 18 0 0 1 20 0z" />
              <circle cx="20" cy="18" r="7" />
              <circle cx="20" cy="74" r="6" />
            </g>

            {/* Odvijač */}
            <g transform="translate(46 152) rotate(14)">
              <rect x="0" y="0" width="18" height="42" rx="7" />
              <path d="M5 42h8v10H5z" />
              <path d="M7 52h4v46l-2 8-2-8z" />
            </g>

            {/* Klešta */}
            <g transform="translate(168 160) rotate(-16)">
              <path d="M14 0 6 40l10 14 10-14L18 0z" />
              <circle cx="16" cy="54" r="5" />
              <path d="M11 60 2 96M21 60l9 36" />
            </g>
          </g>
        </pattern>
      </defs>

      {/* 0.08 umesto 0.05: maska u uglu dodatno spušta vidljivost, pa bez ovoga nestane. */}
      <rect width="100%" height="100%" fill="url(#uz-tools-wallpaper)" opacity="0.08" />
    </svg>
  );
}

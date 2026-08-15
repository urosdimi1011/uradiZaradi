/**
 * Ilustracija alata za desni panel na prijavi.
 *
 * Nacrtana kao SVG, ne fotografija: nema spoljne zavisnosti, oštra je na svakoj
 * rezoluciji, teži ~4KB umesto ~300KB i drži se brend palete. Fotorealističan
 * snimak alata iz mockupa nije moguće verno nacrtati vektorom, pa je uzet
 * stilizovan, ravan prikaz — deluje namerno, a ne kao neuspeo pokušaj kopije.
 *
 * Ako klijent insistira na fotografiji: stavi je u `public/` i zameni ovu
 * komponentu `<Image>` tagom u `prijava/page.tsx`.
 */
export function ToolsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 560"
      className={className}
      role="img"
      aria-label="Ilustracija majstorskog alata"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Tamna drvena podloga, kao radni sto */}
        <linearGradient id="tools-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17171a" />
          <stop offset="100%" stopColor="#0d0d0f" />
        </linearGradient>
        <linearGradient id="tools-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d5d8dd" />
          <stop offset="55%" stopColor="#9aa0a8" />
          <stop offset="100%" stopColor="#6d737b" />
        </linearGradient>
        <linearGradient id="tools-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a97c3f" />
          <stop offset="100%" stopColor="#7a5628" />
        </linearGradient>
        <linearGradient id="tools-brand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd233" />
          <stop offset="100%" stopColor="#e0ac0a" />
        </linearGradient>
        <linearGradient id="tools-pouch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26262b" />
          <stop offset="100%" stopColor="#141417" />
        </linearGradient>
      </defs>

      <rect width="900" height="560" fill="url(#tools-bg)" />

      {/* Daske podloge */}
      <g stroke="#000" strokeOpacity="0.5" strokeWidth="2">
        <path d="M0 118h900M0 300h900M0 470h900" />
      </g>
      <g stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1">
        <path d="M0 120h900M0 302h900M0 472h900" />
      </g>

      {/* ── Alat, poređan iza torbice ── */}

      {/* Metar (žuti) */}
      <g transform="rotate(-7 250 250)">
        <rect x="196" y="120" width="56" height="300" rx="8" fill="url(#tools-brand)" />
        <rect x="196" y="120" width="56" height="300" rx="8" fill="none" stroke="#00000030" strokeWidth="2" />
        <g stroke="#0b0b0c" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
          <path d="M204 150h18M204 172h28M204 194h18M204 216h28M204 238h18M204 260h28M204 282h18M204 304h28M204 326h18M204 348h28" />
        </g>
      </g>

      {/* Odvijač (žuta drška) */}
      <g transform="rotate(6 350 250)">
        <rect x="332" y="96" width="34" height="150" rx="14" fill="url(#tools-brand)" />
        <rect x="340" y="236" width="18" height="26" rx="4" fill="#5c6067" />
        <rect x="344" y="256" width="10" height="150" fill="url(#tools-steel)" />
        <path d="M344 400h10l-3 22h-4z" fill="#8a9099" />
      </g>

      {/* Čekić */}
      <g transform="rotate(-4 470 250)">
        <rect x="452" y="176" width="30" height="250" rx="12" fill="url(#tools-wood)" />
        <g stroke="#00000040" strokeWidth="2">
          <path d="M460 200v200M474 200v200" />
        </g>
        <path
          d="M418 120h84a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10h-84l-22-16a8 8 0 0 1 0-22z"
          fill="url(#tools-steel)"
        />
        <path d="M502 120h22a14 14 0 0 1 14 14v26a14 14 0 0 1-14 14h-22z" fill="#7c828a" />
      </g>

      {/* Klešta */}
      <g transform="rotate(9 610 260)">
        <path d="M596 120l-16 96 22 40 22-40-16-96z" fill="url(#tools-steel)" />
        <circle cx="602" cy="262" r="12" fill="#5c6067" />
        <rect x="566" y="266" width="26" height="150" rx="13" fill="url(#tools-brand)" />
        <rect x="612" y="266" width="26" height="150" rx="13" fill="url(#tools-brand)" />
      </g>

      {/* Ključ */}
      <g transform="rotate(-11 736 250)">
        <rect x="722" y="150" width="28" height="240" rx="14" fill="url(#tools-steel)" />
        <path
          d="M736 100a44 44 0 0 1 30 76l-30-22-30 22a44 44 0 0 1 30-76z"
          fill="url(#tools-steel)"
        />
        <circle cx="736" cy="142" r="17" fill="#0f0f11" />
      </g>

      {/* ── Torbica preko donjeg dela ── */}
      <path d="M60 372h780a24 24 0 0 1 24 24v164H36V396a24 24 0 0 1 24-24z" fill="url(#tools-pouch)" />
      <path
        d="M60 372h780a24 24 0 0 1 24 24v164H36V396a24 24 0 0 1 24-24z"
        fill="none"
        stroke="#3a3a41"
        strokeWidth="2"
      />

      {/* Žuti šav */}
      <path
        d="M64 400h772"
        stroke="url(#tools-brand)"
        strokeWidth="3"
        strokeDasharray="14 12"
        strokeLinecap="round"
      />

      {/* Pregrade torbice */}
      <g fill="none" stroke="#3a3a41" strokeWidth="2">
        <path d="M300 400v160M600 400v160" />
      </g>
      <g stroke="url(#tools-brand)" strokeWidth="2" strokeDasharray="10 10" strokeOpacity="0.55">
        <path d="M300 412v140M600 412v140" />
      </g>

      {/* Zakivci */}
      <g fill="#4a4a52">
        <circle cx="168" cy="392" r="7" />
        <circle cx="450" cy="392" r="7" />
        <circle cx="732" cy="392" r="7" />
      </g>
    </svg>
  );
}

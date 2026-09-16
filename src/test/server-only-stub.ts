/**
 * Zamena za paket `server-only` u testovima.
 *
 * Pravi paket puca pri uvozu van server komponente — to je njegov posao.
 * Vitest nije server komponenta, pa bi svaki test modula koji dodiruje bazu
 * pao pre nego što stigne do prve provere. Zaštita ostaje na snazi tamo gde
 * je bitna: `next build` i dalje odbija da ovakav modul spakuje za pretraživač.
 */
export {};

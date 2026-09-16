import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest — samo unit testovi nad čistom logikom.
 *
 * Bez baze, bez pretraživača, bez Next runtime-a. Sve što traži bilo šta od
 * toga ide u E2E (Playwright), gde se testira kroz pravi pretraživač umesto
 * kroz gomilu lažnjaka koji se pretvaraju da su Next.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      /*
       * `server-only` je paket koji NAMERNO puca kad ga uveze bilo šta osim
       * server komponente — tako Next čuva da tajne ne odu u pretraživač.
       * Vitest nije ni jedno ni drugo, pa ga ovde menjamo praznim modulom.
       * To ne slabi zaštitu: ona i dalje važi pri `next build`.
       */
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    /* Prisma klijent se generiše u `src`; nema šta da se testira u njemu. */
    exclude: ["src/generated/**"],
  },
});

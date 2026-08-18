import { cookies } from "next/headers";

import { DEFAULT_SCRIPT, SCRIPT_COOKIE, type Script } from "./script";

/**
 * Čita izabrano pismo iz cookie-ja.
 *
 * Odvojeno od `script.ts` jer `next/headers` ne sme da uđe u klijentski bundle —
 * a tipove i `t()` iz `script.ts` koriste i klijentske komponente.
 */
export async function getScript(): Promise<Script> {
  const store = await cookies();
  const value = store.get(SCRIPT_COOKIE)?.value;
  return value === "cyrl" ? "cyrl" : DEFAULT_SCRIPT;
}

import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * Jedina ruta koju better-auth traži.
 *
 * Kroz nju idu prijava, registracija, odjava i OAuth povratak sa Google-a.
 * Stoji IZVAN `(public)` grupe, pa ne nasleđuje zaglavlje i podnožje — ovo su
 * API pozivi, ne stranice.
 */
export const { GET, POST } = toNextJsHandler(auth);

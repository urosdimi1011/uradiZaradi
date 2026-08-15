import { Heart } from "lucide-react";

import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import styles from "./majstor-card.module.css";

/**
 * Čuvanje majstora u „Sačuvano".
 *
 * Bez stanja u Fazi 0. U Fazi 1 postaje klijentska komponenta sa Server Action —
 * za goste otvara prijavu, jer lista sačuvanih mora da preživi promenu uređaja.
 */
export function SaveMajstorButton({ script }: { script: Script }) {
  const t = makeT(script);

  return (
    <button type="button" className={styles.save} aria-label={t("saveMajstor")} title={t("saveMajstor")}>
      <Heart width={22} height={22} aria-hidden />
    </button>
  );
}

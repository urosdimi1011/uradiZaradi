import { Eye, MessageSquare } from "lucide-react";

import { formatCount } from "@/lib/format";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import styles from "./majstor-card.module.css";

/**
 * Donja traka kartice — pregledi i poruke.
 *
 * Tekst je u primarnoj (beloj) boji, ikone u sekundarnoj: brojka je informacija,
 * ikona je samo oznaka. Ranije je oboje bilo prigušeno, pa se traka gubila.
 *
 * Brojač poruka ostaje vidljiv iako poruke nisu u MVP opsegu — dolazi iz
 * `MajstorStats` i u Fazi 1 ga puni pravi podatak, bez izmene komponente.
 */
export function MajstorStats({
  profileViews,
  messageCount,
  script,
}: {
  profileViews: number;
  messageCount: number;
  script: Script;
}) {
  const t = makeT(script);

  return (
    <div className={styles.stats}>
      {/*
        Brojka i reč su u ISTOM span-u sa običnim razmakom.
        Da su odvojeni elementi, `gap` bi ih razmakao kao dve stavke ("126   pregleda")
        umesto da izgledaju kao jedna fraza. Gap razdvaja samo ikonu od teksta.
      */}
      <span className={styles.stat}>
        <Eye width={16} height={16} className={styles.statIcon} aria-hidden />
        <span>
          <span className={styles.statValue}>{formatCount(profileViews)}</span> {t("views")}
        </span>
      </span>
      <span className={styles.stat}>
        <MessageSquare width={16} height={16} className={styles.statIcon} aria-hidden />
        <span>
          <span className={styles.statValue}>{formatCount(messageCount)}</span> {t("messages")}
        </span>
      </span>
    </div>
  );
}

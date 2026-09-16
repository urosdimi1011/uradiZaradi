import { Eye, Sparkles } from "lucide-react";
import { oznakaKartice } from "@/modules/majstori/domain/statistika";

import { formatCount } from "@/lib/format";
import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import styles from "./majstor-card.module.css";

/**
 * Donja traka kartice — broj pregleda.
 *
 * Tekst je u primarnoj (beloj) boji, ikone u sekundarnoj: brojka je informacija,
 * ikona je samo oznaka. Ranije je oboje bilo prigušeno, pa se traka gubila.
 *
 * Broj poruka je sklonjen: poruke nisu u MVP opsegu, pa je „0 poruka" bio broj
 * koji nikad nije ni mogao da poraste. Vraća se zajedno sa ćaskanjem.
 */
export function MajstorStats({
  profileViews,
  jeNov,
  script,
}: {
  profileViews: number;
  /** Skoro postavljen profil — vidi `oznakaKartice`. */
  jeNov: boolean;
  script: Script;
}) {
  const t = makeT(script);
  const oznaka = oznakaKartice({ profileViews, jeNov });

  /*
   * Prazna traka se NE iscrtava. Ranije je `div` sa gornjom linijom i unutrašnjim
   * razmakom ostajao i kad u njemu nema ničega, pa je kartica novog majstora
   * imala obris odeljka bez sadržaja — odmah pored kartice sa „213 pregleda".
   */
  if (oznaka === "nista") return null;

  return (
    <div className={styles.stats}>
      {oznaka === "pregledi" ? (
        /*
          Brojka i reč su u ISTOM span-u sa običnim razmakom.
          Da su odvojeni elementi, `gap` bi ih razmakao kao dve stavke ("126   pregleda")
          umesto da izgledaju kao jedna fraza. Gap razdvaja samo ikonu od teksta.

          Poruke se ne prikazuju dok ćaskanje ne postoji — inače je to broj koji
          nikad nije ni mogao da poraste.
        */
        <span className={styles.stat}>
          <Eye width={16} height={16} className={styles.statIcon} aria-hidden />
          <span>
            <span className={styles.statValue}>{formatCount(profileViews)}</span> {t("views")}
          </span>
        </span>
      ) : (
        <span className={`${styles.stat} ${styles.statNew}`}>
          <Sparkles width={16} height={16} className={styles.statIcon} aria-hidden />
          {t("newOnSite")}
        </span>
      )}
    </div>
  );
}

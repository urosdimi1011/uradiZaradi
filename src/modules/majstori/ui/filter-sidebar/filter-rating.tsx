import { Star } from "lucide-react";

import { makeT } from "@/lib/dictionary";
import type { Script } from "@/lib/script";
import styles from "./filter-sidebar.module.css";

/**
 * Filter po oceni — checkboxovi, kako je na mockupu.
 *
 * Napomena o semantici: opcije se preklapaju ("4+" sadrži i "5"), pa više
 * štikliranih ne znači presek nego uniju. Server zato uzima NAJNIŽU označenu
 * vrednost kao prag — jedino tumačenje koje ne vraća prazan rezultat kad
 * korisnik štiklira i "5" i "3+".
 */
const OPTIONS = [
  { value: "5", label: "5" },
  { value: "4", label: "4+" },
  { value: "3", label: "3+" },
];

export function FilterRating({
  script,
  selected,
}: {
  script: Script;
  selected: string[];
}) {
  const t = makeT(script);

  return (
    <fieldset className={styles.group}>
      <legend className={styles.label}>{t("rating")}</legend>

      <div className={styles.checkList}>
        {OPTIONS.map((option) => (
          <label key={option.value} className={styles.checkItem}>
            <input
              type="checkbox"
              name="ocena"
              value={option.value}
              defaultChecked={selected.includes(option.value)}
              className={styles.checkbox}
            />
            <span>{option.label}</span>
            <Star width={13} height={13} className="fill-brand text-brand" aria-hidden />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

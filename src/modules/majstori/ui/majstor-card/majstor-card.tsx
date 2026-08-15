import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { formatPriceCompact } from "@/lib/format";
import { t as pick, type Script } from "@/lib/script";
import { toCyrillic } from "@/lib/translit";
import type { MajstorCardView } from "@/modules/majstori/service";

import { MajstorLocation } from "./majstor-location";
import { MajstorRating } from "./majstor-rating";
import { MajstorStats } from "./majstor-stats";
import { SaveMajstorButton } from "./save-majstor-button";
import styles from "./majstor-card.module.css";

/**
 * Kartica majstora — slika levo, sadržaj desno, statistika kao traka u dnu.
 *
 * Ovde se samo komponuje; svaki deo je zasebna komponenta u istom folderu,
 * pa se ocena i lokacija mogu upotrebiti i na profilu bez kopiranja formata.
 */
export function MajstorCard({
  majstor,
  script,
  priority,
}: {
  majstor: MajstorCardView;
  script: Script;
  priority?: boolean;
}) {
  // Ime unosi majstor latinicom; na ćiriličnoj verziji se transliteruje kao i
  // ostatak korisničkog sadržaja — inače stoji "Stefan Nikolić" pored "Грађевинац".
  const name = script === "cyrl" ? toCyrillic(majstor.displayName) : majstor.displayName;

  return (
    <article className={styles.card}>
      <SaveMajstorButton script={script} />

      <div className={styles.body}>
        <Avatar
          src={majstor.avatarUrl}
          name={majstor.displayName}
          priority={priority}
          sizes="(max-width: 640px) 40vw, (max-width: 1280px) 22vw, 160px"
          className={styles.media}
        />

        <div className={styles.content}>
          <h3 className={styles.name}>
            <Link href={`/majstor/${majstor.slug}`} className={styles.nameLink}>
              {name}
            </Link>
          </h3>

          <p className={styles.category}>
            <span className={styles.categoryName}>{pick(majstor.categoryLabel, script)}</span>
            <VerifiedBadge level={majstor.verificationLevel} size={18} />
          </p>

          <MajstorRating average={majstor.rating.average} count={majstor.rating.count} />

          <MajstorLocation
            city={majstor.cityLabel}
            municipality={majstor.municipalityLabel}
            script={script}
          />

          {majstor.priceFrom ? (
            <p className={styles.price}>
              {formatPriceCompact(majstor.priceFrom.amountMinor, majstor.priceFrom.unit, script)}
            </p>
          ) : null}
        </div>
      </div>

      <MajstorStats
        profileViews={majstor.profileViews}
        messageCount={majstor.messageCount}
        script={script}
      />
    </article>
  );
}

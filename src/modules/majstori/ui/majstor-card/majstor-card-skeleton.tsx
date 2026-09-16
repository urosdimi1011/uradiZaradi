import styles from "./majstor-card.module.css";

/**
 * Skeleton kartice majstora.
 *
 * Namerno koristi iste klase rasporeda kao prava kartica, pa se prelaz sa
 * skeleta na sadržaj ne vidi kao poskakivanje — visina i raspored su isti.
 *
 * `aria-hidden` jer je čisti placeholder; stanje učitavanja se saopštava
 * preko `aria-busy` na listi koja ga sadrži.
 */
export function MajstorCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonPulse}`} aria-hidden>
      <div className={styles.body}>
        <div className={styles.media} />

        <div className={styles.content}>
          <div className={styles.skeletonLine} style={{ height: 17, width: "78%" }} />
          <div
            className={styles.skeletonLine}
            style={{ height: 13, width: "48%", marginTop: 10 }}
          />
          <div
            className={styles.skeletonLine}
            style={{ height: 13, width: "40%", marginTop: 12 }}
          />
          <div
            className={styles.skeletonLine}
            style={{ height: 13, width: "62%", marginTop: 10 }}
          />
          <div
            className={styles.skeletonLine}
            style={{ height: 15, width: "55%", marginTop: "auto" }}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.skeletonLine} style={{ height: 13, width: 86 }} />
        <div className={styles.skeletonLine} style={{ height: 13, width: 70 }} />
      </div>
    </article>
  );
}

/**
 * Mreža skeleta — isti prelom kao mreža rezultata.
 *
 * `count` prosleđuje pozivalac i to je STVARAN broj rezultata koji stiže, ne
 * pretpostavka: listing prebroji rezultate pre nego što uđe u `<Suspense>`, jer
 * je brojanje jeftino a sklapanje kartica nije. Šest praznih okvira koji se
 * sruče u jedan izgleda kao greška, ne kao učitavanje.
 */
export function MajstorGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex">
          <MajstorCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

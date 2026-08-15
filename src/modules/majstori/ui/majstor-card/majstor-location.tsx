import { MapPin } from "lucide-react";

import { t as pick, type Script } from "@/lib/script";
import type { LocalizedText } from "@/modules/shared/domain/primitives";
import styles from "./majstor-card.module.css";

/**
 * Grad i opština. Opština je opciona — majstor koji je ne unese ne sme da
 * dobije prazan separator ("Beograd · ").
 */
export function MajstorLocation({
  city,
  municipality,
  script,
}: {
  city: LocalizedText;
  municipality: LocalizedText | null;
  script: Script;
}) {
  const label = municipality
    ? `${pick(city, script)} · ${pick(municipality, script)}`
    : pick(city, script);

  return (
    <p className={styles.location}>
      <MapPin width={15} height={15} className={styles.locationIcon} aria-hidden />
      <span className={styles.locationText}>{label}</span>
    </p>
  );
}

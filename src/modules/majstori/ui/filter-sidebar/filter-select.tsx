import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import styles from "./filter-sidebar.module.css";

/**
 * Padajuća lista sa fiksiranom strelicom desno.
 *
 * Native strelica se gasi (`appearance: none`) jer izgleda različito na svakom
 * sistemu; naša ide u apsolutnu poziciju, a `select` dobija desni razmak da
 * duga vrednost ne prođe ispod nje.
 */
export function FilterSelect({
  id,
  name,
  label,
  defaultValue,
  className,
  children,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(styles.group, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.selectWrap}>
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          className={cn(styles.control, styles.select)}
        >
          {children}
        </select>
        <ChevronDown width={15} height={15} aria-hidden className={styles.chevron} />
      </div>
    </div>
  );
}

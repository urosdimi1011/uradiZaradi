import { BadgeCheck } from "lucide-react";
import type { VerificationLevel } from "@/modules/majstori/domain";
import { cn } from "@/lib/cn";

/**
 * Kvačica se prikazuje SAMO za nivo IDENTITY.
 * Potvrđen telefon nije dokaz da je neko majstor, pa ne zaslužuje istu oznaku.
 */
export function VerifiedBadge({
  level,
  size = 16,
  className,
}: {
  level: VerificationLevel;
  size?: number;
  className?: string;
}) {
  if (level !== "IDENTITY") return null;
  return (
    <BadgeCheck
      width={size}
      height={size}
      className={cn("shrink-0 fill-brand text-surface-base", className)}
      aria-label="Verifikovan majstor"
    />
  );
}

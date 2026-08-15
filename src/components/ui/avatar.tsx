import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Kad slika ne postoji (ili remote host ne odgovori), pada na inicijale
 * na brend gradijentu umesto na slomljenu ikonu. Bitno za demo, bitnije u produkciji
 * gde profili u DRAFT statusu često nemaju fotografiju.
 */
export function Avatar({
  src,
  name,
  className,
  sizes,
  priority,
}: {
  src: string | null;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className={cn("relative overflow-hidden bg-surface-hover", className)}>
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-surface-hover to-surface-card">
        <span className="text-xl font-semibold text-content-muted">{initials}</span>
      </div>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes ?? "96px"}
          priority={priority}
          className="object-cover"
        />
      ) : null}
    </div>
  );
}

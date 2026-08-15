import {
  Droplets,
  Grid2x2,
  Hammer,
  HardHat,
  KeyRound,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  PaintRoller,
  Wind,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Eksplicitna mapa umesto dinamičkog importa po imenu:
 * pogrešno ime ikone u seed-u puca na build-u, a ne tiho renderuje prazninu.
 */
const ICONS = {
  PaintRoller,
  Zap,
  Droplets,
  Grid2x2,
  Hammer,
  Wind,
  HardHat,
  KeyRound,
  Layers,
  LayoutGrid,
  MoreHorizontal,
} satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof ICONS;

export function CategoryIcon({
  name,
  size = 22,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name as CategoryIconName] ?? LayoutGrid;
  return <Icon width={size} height={size} className={className} aria-hidden />;
}

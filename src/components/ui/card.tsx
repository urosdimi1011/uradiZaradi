import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 px-6 pt-6 pb-4", className)}>
      <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
      {action}
    </div>
  );
}

/**
 * Telo kartice.
 *
 * Gornji razmak postoji SAMO kad tela nema iznad sebe zaglavlje (`first:pt-6`).
 * Bez toga je `<Card><CardBody>` bez zaglavlja lepio sadržaj uz samu ivicu —
 * naslov „Ostavite recenziju" je stajao na liniji okvira. Sa zaglavljem se
 * razmak ne dodaje jer ga zaglavlje već nosi, pa se ne udvostručuje.
 */
export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6 first:pt-6", className)} {...props} />;
}

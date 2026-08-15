import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-[var(--radius-control)] border border-line bg-surface-input text-content-primary placeholder:text-content-muted transition-colors hover:border-line-strong focus:border-brand";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-12 px-4 text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlBase, "min-h-32 p-4 text-sm", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(controlBase, "h-12 px-4 text-sm appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

/** Input sa ikonicom sa leve strane — obrazac sa auth ekrana u mockupu. */
export function InputWithIcon({
  icon,
  trailing,
  className,
  ...props
}: { icon: ReactNode; trailing?: ReactNode } & ComponentProps<"input">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-content-muted">
        {icon}
      </span>
      <input className={cn(controlBase, "h-12 pl-12 pr-12 text-sm", className)} {...props} />
      {trailing ? (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-2 block text-sm font-medium text-content-secondary", className)}
      {...props}
    />
  );
}

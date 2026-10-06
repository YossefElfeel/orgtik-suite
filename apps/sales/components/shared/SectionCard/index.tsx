import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  children,
  action,
  className,
  style,
}: {
  title: string | ReactNode;
  children: ReactNode;
  action?: ReactNode | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-white px-5 py-3.5 ",
        className,
      )}
      style={style}
    >
      <div className="mb-3.5 flex shrink-0 items-center justify-between gap-3 border-b border-border pb-2.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {action && action}
      </div>
      {children}
    </section>
  );
}

export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-semibold w-28">{label}</span>
      <div className="text-sm flex-1 text-secondary">{children}</div>
    </div>
  );
}

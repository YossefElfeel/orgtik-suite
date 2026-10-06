import type { Icon as LucideIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionCardProps = {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, icon: Icon, action, children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Icon className="size-6 text-foreground" />
          <h3 className="text-lg leading-6 font-medium text-foreground">{title}</h3>
        </div>
        {action}
      </div>

      <div className="mt-4 h-px w-full bg-border" />

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

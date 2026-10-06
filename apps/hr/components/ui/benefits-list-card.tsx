"use client";
import { CaretDown as ChevronDown, Gift, PencilSimple as Pencil, UserCircle as CircleUserRound } from "@phosphor-icons/react";
import type { Icon as LucideIcon } from "@phosphor-icons/react";


import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BenefitItem = {
  id: string;
  label: string;
  value: string;
  icon?: LucideIcon;
};

type BenefitsListCardProps = {
  title?: string;
  items: BenefitItem[];
  onEdit?: () => void;
  className?: string;
};

function BenefitRow({ label, value, icon: Icon = Gift }: Omit<BenefitItem, "id">) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-5 shrink-0 text-fg-muted" />
      <p className="w-[150px] shrink-0 text-sm leading-[18px] font-normal text-fg-muted">{label}</p>
      <p className="min-w-0 flex-1 text-sm leading-[18px] font-medium text-fg">{value}</p>
    </div>
  );
}

export function BenefitsListCard({
  title = "Benefits",
  items,
  onEdit,
  className,
}: BenefitsListCardProps) {
  const [firstItem, secondItem, ...restItems] = items;

  return (
    <section
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl border border-line bg-raised p-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <CircleUserRound className="size-6 text-fg" />
          <h3 className="text-lg leading-6 font-medium text-fg">{title}</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 gap-1.5 rounded-lg border-line px-2 text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
        >
          <Pencil className="size-4" />
          <span className="text-xs leading-4 font-medium">Edit</span>
          <ChevronDown className="size-4" />
        </Button>
      </div>

      <div className="h-px w-full bg-line" />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {firstItem ? <BenefitRow label={firstItem.label} value={firstItem.value} icon={firstItem.icon} /> : null}
          {secondItem ? <BenefitRow label={secondItem.label} value={secondItem.value} icon={secondItem.icon} /> : null}
        </div>
        {restItems.map((item) => (
          <BenefitRow key={item.id} label={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>
    </section>
  );
}


import type { PlanDetailFeatureTag } from "@/types/plans";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

const tagStyles: Record<
  PlanDetailFeatureTag,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  public: "ghost-blue",
  private: "ghost-yellow",
  internal: "ghost-yellow",
  installment: "ghost-primary",
  full_payment: "ghost-verdigris",
  cash_only: "ghost-blue",
};

const mapTagToKey = (tag: PlanDetailFeatureTag) => {
  if (tag === "cash_only") return "cashOnly";
  if (tag === "full_payment") return "fullPayment";
  return tag;
};

type Props = {
  tag: PlanDetailFeatureTag;
  className?: string;
};

export function PlanFeatureTagBadge({ tag, className }: Props) {
  const tCommon = useTranslations("common");
  return (
    <Badge variant={tagStyles[tag]} className={className}>
      {tCommon(mapTagToKey(tag))}
    </Badge>
  );
}

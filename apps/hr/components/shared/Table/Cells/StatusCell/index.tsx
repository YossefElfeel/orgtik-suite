import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
export type IAllStatus = "new" | "pending" | "completed" | "paid" | "failed";

type Props = {
  status: IAllStatus;
  onclick?: () => void;
  disabled?: boolean;
  className?: string;
};

function formatStatus(status: string): string {
  return status
    ?.split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// The codes with a label in the "statusBadge" catalog; any other code is shown as the API sent it.
const LABELLED: readonly string[] = ["new", "pending", "completed", "paid", "failed"];

function StatusCell({ status, onclick, disabled, className }: Props) {
  const t = useTranslations("statusBadge");
  const checkStatus = status?.toLowerCase() as keyof typeof statusStyles;

  const statusStyles = {
    pending:
      "bg-warning-subtle hover:bg-warning-subtle text-warning border-warning/30",
    new: "bg-info-subtle hover:bg-info-subtle text-info border-info/30",
    completed: "bg-success-subtle hover:bg-success-subtle text-success border-success/30",
    paid: "bg-success-subtle hover:bg-success-subtle text-success border-success/30",
    failed: "bg-danger-subtle hover:bg-danger-subtle text-danger border-danger/30",
  };

  const handleClick = () => {
    if (!disabled && onclick) {
      onclick();
    }
  };

  return (
    <Badge
      onClick={handleClick}
      aria-disabled={disabled}
      variant="outline"
      className={cn(
        "transition-all duration-300 flex w-fit rounded-xl items-center gap-1.5 px-2.5 py-1",
        onclick && !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        statusStyles[checkStatus] || "bg-sunken text-fg-muted border-line-strong",
        className,
      )}
    >
      {LABELLED.includes(checkStatus) ? t(checkStatus) : formatStatus(status)}
    </Badge>
  );
}

export default StatusCell;

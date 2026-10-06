import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export type IAllStatus = "new" | "pending" | "completed";

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

function StatusCell({ status, onclick, disabled, className }: Props) {
  const checkStatus = status?.toLowerCase() as keyof typeof statusStyles;

  const statusStyles = {
    pending:
      "bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200",
    new: "bg-primary/10 hover:bg-blue-100 text-primary border-primary",
    completed: "bg-green-50 hover:bg-green-100 text-green-600 border-green-200",
    replied:
      "bg-[#32ABB9]/10 hover:bg-[#32ABB9]/20 text-[#32ABB9] border-[#32ABB9]",
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
        statusStyles[checkStatus] || "bg-gray-50 text-gray-600 border-gray-300",
        className
      )}
    >
      {formatStatus(status)}
    </Badge>
  );
}

export default StatusCell;

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  emphasized?: boolean;
};

export default function CustomInvoiceSummaryRow({
  label,
  value,
  emphasized = false,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={cn(
          emphasized ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          emphasized
            ? "font-semibold text-foreground"
            : "font-medium text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

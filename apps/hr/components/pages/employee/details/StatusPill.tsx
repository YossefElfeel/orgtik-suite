import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: string;
};

export function StatusPill({ status }: StatusPillProps) {
  const t = useTranslations("attendanceTable.statuses");
  const tBadge = useTranslations("statusBadge");
  // Request and attendance statuses ("Late", "On leave") get their word in the reader's language;
  // anything else shows as the API sends it.
  const key = status.toLowerCase().trim().replace(/[\s-]+/g, "_");
  const label = t.has(key) ? t(key) : tBadge.has(key) ? tBadge(key) : status;
  const isApproved = key === "approved";
  const tone = isApproved
    ? "bg-success-subtle text-success border border-success/30"
    : "bg-info-subtle text-info border border-info/30";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        tone
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isApproved ? "bg-success-solid" : "bg-info-solid"
        )}
      />
      {label}
    </span>
  );
}

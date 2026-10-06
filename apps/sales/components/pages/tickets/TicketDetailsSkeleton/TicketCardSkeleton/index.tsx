import Skeleton from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

type Props = {
  rows: number;
  className?: string;
};

export default function TicketCardSkeleton({ rows, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-white px-5 py-3.5",
        className,
      )}
    >
      <div className="mb-3.5 border-b border-border pb-2.5">
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </section>
  );
}

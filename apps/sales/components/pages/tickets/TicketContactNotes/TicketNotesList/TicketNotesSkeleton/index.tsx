import Skeleton from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

type Props = {
  count?: number;
};

const placeholders = [
  { isOwn: false, width: "w-3/5" },
  { isOwn: true, width: "w-2/5" },
  { isOwn: false, width: "w-1/2" },
  { isOwn: true, width: "w-3/5" },
];

export default function TicketNotesSkeleton({ count }: Props) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {placeholders
        .slice(0, count ?? placeholders.length)
        .map((placeholder, index) => (
          <div
            key={index}
            className={cn(
              "flex w-full",
              placeholder.isOwn ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-border px-4 py-3",
                placeholder.width,
              )}
            >
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
    </div>
  );
}

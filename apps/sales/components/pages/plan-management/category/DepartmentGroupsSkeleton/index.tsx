import Skeleton from "@/components/shared/Skeleton";

type Props = {
  count?: number;
};

export default function DepartmentGroupsSkeleton({ count = 3 }: Props) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="size-4.5 shrink-0 rounded" />
                <Skeleton className="h-6 w-48 max-w-full" />
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

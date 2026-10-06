import Skeleton from "@/components/shared/Skeleton";

type Props = {
  count?: number;
};

export default function CategoryRowsSkeleton({ count = 3 }: Props) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 border-b border-border py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

import Skeleton from "@/components/shared/Skeleton";

export default function SubscriptionDetailsHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-1" aria-busy="true">
      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-6 w-72 max-w-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

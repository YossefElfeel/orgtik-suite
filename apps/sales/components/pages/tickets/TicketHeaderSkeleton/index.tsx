import Skeleton from "@/components/shared/Skeleton";

export default function TicketHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

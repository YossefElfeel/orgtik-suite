import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeSkeleton() {
  return (
    <div className="w-full min-h-[270px] bg-raised border border-line shadow-sm flex flex-col items-center relative rounded-md p-2.5 gap-2.5">
      <div className="absolute top-1 end-1 p-2">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>

      <div className="mt-1 flex flex-col items-center gap-2 w-full">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="w-full border border-line rounded-[4px] p-3 mt-auto space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-3.5 w-3.5 shrink-0" />
          <Skeleton className="h-4 w-full" />
        </div>

        <div className="flex items-center gap-2.5">
          <Skeleton className="h-3.5 w-3.5 shrink-0" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-3.5 w-3.5 shrink-0" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3.5 w-3.5 shrink-0" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Skeleton from "@/components/shared/Skeleton";
import { useRole } from "@/hooks/useRole";

function PaymentHistoryRowSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-44 max-w-full" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
    </div>
  );
}

export default function SubscriptionDetailsSkeleton() {
  const { isCustomer } = useRole();

  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <section className="flex flex-col gap-5 rounded-xl border border-border bg-white px-5 py-4">
        <div className="flex flex-col gap-3 rounded-xl border border-primary/60 bg-primary/10 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-background px-3 py-2.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-36 max-w-full" />
            </div>
          ))}
        </div>

        {isCustomer ? null : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-3">
              <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-white px-5 py-3.5">
        <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-border pb-2.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <PaymentHistoryRowSkeleton key={index} />
          ))}
        </div>
      </section>

      {isCustomer ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-24 rounded-lg" />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={`action-${index}`} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

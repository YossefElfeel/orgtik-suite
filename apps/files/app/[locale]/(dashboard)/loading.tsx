import { getTranslations } from "next-intl/server";
import { Skeleton } from "@orgtik/ui";

// Between pages: the shape of a page header and a grid of cards, on library skeletons (they rest
// still under reduced motion), announced once as loading.
export default async function Loading() {
  const t = await getTranslations("Errors");
  return (
    <div role="status" aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-card border border-line bg-raised">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

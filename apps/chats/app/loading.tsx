import { LoadingState } from "@orgtik/ui";
import { getT } from "@/lib/server-i18n";

// While a page's data and code arrive: a named, polite status rather than a blank screen (CHT-023).
export default async function Loading() {
  const t = await getT();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <LoadingState label={t("errors.loading", "Loading…")} />
    </main>
  );
}

import { LoadingState } from "@orgtik/ui";

// While a page's data and code arrive: a named, polite status rather than a bare spinner (FS-HR-3).
export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <LoadingState />
    </main>
  );
}

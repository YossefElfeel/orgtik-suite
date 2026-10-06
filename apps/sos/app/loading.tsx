import { Spinner } from "@orgtik/ui";

// Between pages: one spinner, announced by the library (the old Loader2 didn't spin or speak).
export default function Loading() {
  return (
    <main className="grid min-h-dvh w-full place-items-center bg-canvas">
      <Spinner />
    </main>
  );
}

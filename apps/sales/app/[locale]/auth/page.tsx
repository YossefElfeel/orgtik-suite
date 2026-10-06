import { Suspense } from "react";
import { Spinner } from "@orgtik/ui";
import AuthContent from "@/components/pages/auth/AuthContent";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh w-full place-items-center">
          <Spinner />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

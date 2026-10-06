"use client";

import { Suspense } from "react";
import AuthContent from "@/components/pages/auth/AuthContent";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

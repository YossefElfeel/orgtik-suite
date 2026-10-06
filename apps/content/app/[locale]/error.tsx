"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl  p-8 text-center border border-gray-300">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>
          </div>

          {/* Error message */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 font-mono break-words">
              {error.message || "An unexpected error occurred"}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} size={"lg"} className="h-12">
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              size={"lg"}
              variant={"outline"}
              className="h-12"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

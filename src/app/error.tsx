"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container-kansliet text-center">
        <h1 className="text-caps text-5xl font-light mb-6">SYSTEM ERROR</h1>
        <p className="text-normal-case text-base font-light opacity-60 mb-8 max-w-md mx-auto">
          Something went wrong. The system encountered an unexpected error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>TRY AGAIN</Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
          >
            RETURN HOME
          </Button>
        </div>
      </div>
    </div>
  );
}

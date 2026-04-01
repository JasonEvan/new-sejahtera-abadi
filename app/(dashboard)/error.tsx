"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-destructive/30 bg-card p-6 text-center">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">
        Unable to load dashboard
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Something went wrong while loading dashboard data."}
      </p>
      <div className="mt-5 flex justify-center">
        <Button type="button" onClick={reset} className="cursor-pointer">
          <RefreshCcw />
          Try Again
        </Button>
      </div>
    </div>
  );
}

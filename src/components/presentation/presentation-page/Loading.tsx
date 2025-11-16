"use client";

import { Spinner } from "@/components/ui/spinner";
import { ThemeBackground } from "../theme/ThemeBackground";

export function LoadingState() {
  return (
    <ThemeBackground>
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center">
        <div className="relative">
          <Spinner className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">Loading Slides</h2>
          <p className="text-muted-foreground">Getting your slides ready...</p>
        </div>
      </div>
    </ThemeBackground>
  );
}


export function LoadingStateWithFixedBackground() {
  return (
    <div
      className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center"
      style={{ backgroundColor: "#F3F4EF" }}
    >
      <div className="relative">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#304674] border-r-transparent"></div>
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Loading Slides</h2>
        <p className="text-gray-600">Getting your slides ready...</p>
      </div>
    </div>
  );
}

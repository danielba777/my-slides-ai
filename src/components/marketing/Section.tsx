"use client";
import { type PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
  container = true,
}: PropsWithChildren<{ id?: string; className?: string; container?: boolean }>) {
  return (
    <section id={id} className={cn("py-10 sm:py-14", className)}>
      <div className={cn(container && "mx-auto w-full max-w-6xl px-5 sm:px-6")}>
        {children}
      </div>
    </section>
  );
}
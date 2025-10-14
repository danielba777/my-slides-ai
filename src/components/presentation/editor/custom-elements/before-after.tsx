"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { PlateElement, type PlateElementProps } from "platejs/react";
import React from "react";

export default function BeforeAfterGroup(props: PlateElementProps) {
  const childrenArray = React.Children.toArray(props.children);
  const beforeSide = childrenArray[0] ?? null;
  const afterSide = childrenArray[1] ?? null;

  return (
    <PlateElement {...props}>
      <div
        className={cn(
          "mb-4 grid grid-cols-[1fr_auto_1fr]  items-start gap-8 md:gap-10",
        )}
      >
        <div className={cn("flex flex-col items-center gap-6")}>
          {beforeSide}
        </div>
        <div className={cn("flex items-center justify-center self-center")}>
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-full text-xl font-bold shadow-xl",
            )}
            style={{
              backgroundColor:
                (props.element.color as string) ||
                "var(--presentation-primary)",
              color: "var(--presentation-background)",
              boxShadow:
                "0 10px 30px rgba(108,122,224,0.3), 0 0 0 6px rgba(108,122,224,0.08)",
              pointerEvents: "none",
            }}
          >
            <ArrowRight />
          </div>
        </div>
        <div className={cn("flex flex-col items-center gap-6")}>
          {afterSide}
        </div>
      </div>
    </PlateElement>
  );
}

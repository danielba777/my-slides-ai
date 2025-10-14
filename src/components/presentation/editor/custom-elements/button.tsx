"use client";

import { cn } from "@/lib/utils";
import { PlateElement, type PlateElementProps } from "platejs/react";
import { type TButtonElement } from "../plugins/button-plugin";

export default function ButtonElement(
  props: PlateElementProps<TButtonElement>,
) {
  const variant = props.element.variant ?? "filled";
  const size = props.element.size ?? "md";

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1 text-sm"
      : size === "lg"
        ? "px-6 py-3 text-lg"
        : "px-4 py-2 text-base";

  const commonClasses = "inline-flex items-center gap-2 rounded-md font-medium";

  const variantClasses =
    variant === "outline"
      ? "border" // colors styled inline via CSS vars below
      : variant === "ghost"
        ? "bg-transparent"
        : "shadow-sm";

  const style: React.CSSProperties = (() => {
    if (variant === "outline") {
      return {
        color: (props.element.color as string) || "var(--presentation-primary)",
        backgroundColor: "transparent",
        borderColor:
          (props.element.color as string) || "var(--presentation-primary)",
      } as React.CSSProperties;
    }
    if (variant === "ghost") {
      return {
        color: (props.element.color as string) || "var(--presentation-primary)",
        backgroundColor: "transparent",
      } as React.CSSProperties;
    }
    // filled
    return {
      backgroundColor:
        (props.element.color as string) || "var(--presentation-primary)",
      color: "var(--presentation-background)",
    } as React.CSSProperties;
  })();

  return (
    <PlateElement {...props}>
      <div
        className={cn(
          "presentation-element",
          commonClasses,
          sizeClasses,
          variantClasses,
        )}
        style={style}
      >
        {props.children}
      </div>
    </PlateElement>
  );
}

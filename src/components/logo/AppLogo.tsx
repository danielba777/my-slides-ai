"use client";

import { cn } from "@/lib/utils";

interface AppLogoProps {
  dark?: boolean;
  size?: number | string;
  className?: string;
  borderRadius?: number | string;
}

const LOGO_VIEWBOX = "2 6 26 18";
const LOGO_PATH =
  "M8 6.5L8 23.5C8 23.7761 8.22386 24 8.5 24L21.5 24C21.7761 24 22 23.7761 22 23.5L22 6.5C22 6.22386 21.7761 6 21.5 6L8.5 6C8.22386 6 8 6.22386 8 6.5ZM2 22.5C2 22.7761 2.22386 23 2.5 23C2.77614 23 3 22.7761 3 22.5L3 7.5C3 7.22386 2.77614 7 2.5 7C2.22386 7 2 7.22386 2 7.5L2 22.5ZM27 22.5C27 22.7761 27.2239 23 27.5 23C27.7761 23 28 22.7761 28 22.5L28 7.5C28 7.22386 27.7761 7 27.5 7C27.2239 7 27 7.22386 27 7.5L27 22.5ZM7 21.5L4.7235 22.9472C4.39105 23.1134 3.99989 22.8717 3.99989 22.5L3.99989 7.5C3.99989 7.12831 4.39105 6.88656 4.7235 7.05279L7 8.5L7 21.5ZM22.9999 21.5L25.2764 22.9472C25.6088 23.1134 26 22.8717 26 22.5L26 7.5C26 7.12831 25.6088 6.88656 25.2764 7.05279L22.9999 8.5L22.9999 21.5Z";

export function AppLogo({
  dark = false,
  size = 48,
  className,
  borderRadius,
}: AppLogoProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  const backgroundClass = dark ? "bg-white" : "bg-black";
  const fillColor = dark ? "#000000" : "#ffffff";
  const borderRadiusStyle =
    borderRadius !== undefined
      ? {
          borderRadius:
            typeof borderRadius === "number"
              ? `${borderRadius}px`
              : borderRadius,
        }
      : {};

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg",
        backgroundClass,
        className,
      )}
      style={{ width: dimension, height: dimension, ...borderRadiusStyle }}
      aria-label="SlidesCockpit logo"
    >
      <svg
        viewBox={LOGO_VIEWBOX}
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
        className="h-[85%] w-[85%]"
      >
        <path d={LOGO_PATH} fill={fillColor} />
      </svg>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";

import logoDark from "@/assets/logo_dark.png";
import logoLight from "@/assets/logo_light.png";

interface AppLogoProps {
  
  dark?: boolean;
  size?: number | string;
  className?: string;
  borderRadius?: number | string;
}

export function AppLogo({
  dark,
  size = 48,
  className,
  borderRadius,
}: AppLogoProps) {
  const { resolvedTheme } = useTheme();
  const isThemeDark = resolvedTheme === "dark";

  const dimension = typeof size === "number" ? `${size}px` : size ?? "48px";
  const borderRadiusStyle =
    borderRadius !== undefined
      ? {
          borderRadius:
            typeof borderRadius === "number"
              ? `${borderRadius}px`
              : borderRadius,
        }
      : {};

  
  
  const shouldUseDarkLogo =
    typeof dark === "boolean" ? dark : !isThemeDark || resolvedTheme === undefined;

  const logoSrc = shouldUseDarkLogo ? logoDark : logoLight;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg",
        className,
      )}
      style={{ width: dimension, height: dimension, ...borderRadiusStyle }}
      aria-label="SlidesCockpit logo"
    >
      <Image
        src={logoSrc}
        alt="SlidesCockpit logo"
        width={750}
        height={750}
        
        quality={75}
        priority={typeof size === "number" && size <= 64}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

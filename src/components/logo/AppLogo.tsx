"use client";

import logoDark from "@/assets/logo_dark.png";
import logoLight from "@/assets/logo_light.png";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AppLogoProps {
  dark?: boolean;
  size?: number | string;
  className?: string;
}

export function AppLogo({ dark = false, size = 48, className }: AppLogoProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  const backgroundClass = dark ? "bg-white" : "bg-black";
  const logo = dark ? logoDark : logoLight;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-sm",
        backgroundClass,
        className,
      )}
      style={{ width: dimension, height: dimension }}
    >
      <Image
        src={logo}
        alt="SlidesCockpit logo"
        fill
        className="p-0 object-contain"
        priority
      />
    </div>
  );
}

import type { ReactNode } from "react";

export function MarketingPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/* Globales Hintergrund-Pattern für alle Sections außer Hero */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 bg-repeat"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='%23304674'%20fill-opacity='0.03'%3E%3Cpath%20d='M30%2030h30v30H30z'/%3E%3Cpath%20d='M0%200h30v30H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {children}
    </div>
  );
}
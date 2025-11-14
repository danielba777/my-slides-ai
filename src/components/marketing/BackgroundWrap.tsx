import type { ReactNode } from "react";

export function MarketingPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F4EF]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-35 bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='%23304674'%20fill-opacity='0.04'%3E%3Cpath%20d='M30%2030h30v30H30z'/%3E%3Cpath%20d='M0%200h30v30H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}

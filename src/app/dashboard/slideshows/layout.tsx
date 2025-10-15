import { PresentationGenerationManager } from "@/components/presentation/dashboard/PresentationGenerationManager";
import type { ReactNode } from "react";

export default function PresentationSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <PresentationGenerationManager />
      {children}
    </>
  );
}

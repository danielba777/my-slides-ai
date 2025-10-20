"use client";

import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { PresentationControls } from "./PresentationControls";
import { PresentationExamples } from "./PresentationExamples";
import { PresentationHeader } from "./PresentationHeader";
import { PresentationInput } from "./PresentationInput";
import { PresentationsSidebar } from "./PresentationsSidebar";
import { RecentPresentations } from "./RecentPresentations";

export function PresentationDashboard({
  sidebarSide,
}: {
  sidebarSide?: "left" | "right";
}) {
  const router = useRouter();
  const {
    presentationInput,
    isGeneratingOutline,
    setCurrentPresentation,
    setIsGeneratingOutline,
    language,
    theme,
    setShouldStartOutlineGeneration,
  } = usePresentationState();

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
  }, []);

  const handleGenerate = async () => {
    if (!presentationInput.trim()) {
      toast.error("Please enter an AI prompt for your presentation");
      return;
    }

    // Set UI loading state
    setIsGeneratingOutline(true);

    try {
      const result = await createEmptyPresentation(
        derivePresentationTitleFromPrompt(presentationInput),
        theme,
        language,
      );

      if (result.success && result.presentation) {
        // Setze Pending-Cookie, sodass die Zielseite sofort loslegt
        try {
          const domain =
            typeof window !== "undefined" && window.location.hostname === "localhost"
              ? "localhost"
              : ".allweone.com";
          document.cookie =
            `presentation_generation_pending=true; path=/; SameSite=Lax;` +
            (domain !== "localhost" ? ` domain=${domain};` : "");
        } catch {}
        // Set the current presentation
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title,
        );
        router.push(
          `/dashboard/slideshows/generate/${result.presentation.id}`,
        );
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  return (
    <div className="notebook-section relative h-full w-full">
      <PresentationsSidebar side={sidebarSide} />
      <div className="mx-auto max-w-4xl space-y-12 px-6 py-12">
        <PresentationHeader />

        <div className="space-y-8">
          <PresentationInput handleGenerate={handleGenerate} />
          <PresentationControls />

          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!presentationInput.trim() || isGeneratingOutline}
                variant={isGeneratingOutline ? "loading" : "default"}
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Generate Presentation
              </Button>
            </div>
          </div>
        </div>

        <PresentationExamples />
        <RecentPresentations />
      </div>
    </div>
  );
}

function derivePresentationTitleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "Untitled Presentation";

  const aboutPattern = trimmed.match(/slides?\s+(?:about|on)\s+['\"]?([^'\"\n]+)['\"]?/i);
  if (aboutPattern && aboutPattern[1]) {
    return toTitleCase(aboutPattern[1].trim()).slice(0, 80) || "Untitled Presentation";
  }

  const firstLine = trimmed.split(/\r?\n/)[0] ?? trimmed;
  const firstSentence = firstLine.split(/(?<=[.!?])/)[0];
  const fallback = firstSentence || trimmed;
  return toTitleCase(fallback).slice(0, 80) || "Untitled Presentation";
}

function toTitleCase(input: string): string {
  return input.replace(/\w[\w']*/g, (word) => {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

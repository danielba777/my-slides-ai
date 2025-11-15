"use client";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { Sparkles } from "lucide-react";
import { TemplatePreview } from "./TemplatePreview";

export function PresentationInput({
  handleGenerate,
}: {
  handleGenerate: () => void;
}) {
  const { presentationInput, setPresentationInput, setShowTemplates, selectedTemplate } =
    usePresentationState();

  // If a template is selected, show the preview instead of the input
  if (selectedTemplate) {
    return <TemplatePreview />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-foreground">1. Prompt</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(true)}
          className="gap-2 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Start with template
        </Button>
      </div>

      <div className="relative group">
        <textarea
          value={presentationInput}
          onChange={(e) => setPresentationInput(e.target.value)}
          placeholder={`Example: "I want 6 slides about 'underrated habits that build structure' with the first slide text saying ..."`}
          className="h-80 w-full resize-none rounded-lg border border-border bg-card px-4 py-3.5 pb-12 text-base text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />

        {/*
        <div className="absolute bottom-3 right-3 z-10">
          <WebSearchToggle />
        </div>
        */}
      </div>
    </div>
  );
}

"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AiAvatarPromptInput({
  value,
  onChange,
  onShowTemplates,
  onGenerate,
  isGenerating,
}: {
  value: string;
  onChange: (value: string) => void;
  onShowTemplates: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const isGenerateDisabled = isGenerating || !value.trim();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 bg-white rounded-2xl p-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder='e.g. "portrait of a fashion model, muted neon lighting, 85mm lens..."'
          aria-label="Prompt"
          className="h-72 w-full resize-none bg-transparent text-base border-none outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none"
        />
        <div className="w-full flex justify-end">
          <Button
            type="button"
            onClick={onGenerate}
            disabled={isGenerateDisabled}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Spinner className="h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

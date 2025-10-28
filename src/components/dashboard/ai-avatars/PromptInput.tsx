"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AiAvatarPromptInput({
  value,
  onChange,
  onGenerate,
  onToggleThemes,
  selectedThemeImages,
  hasSelectedTheme,
  isGenerating,
}: {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onToggleThemes: () => void;
  selectedThemeImages: string[];
  hasSelectedTheme: boolean;
  isGenerating: boolean;
}) {
  const isGenerateDisabled = isGenerating || !value.trim();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder='e.g. "portrait of a fashion model, muted neon lighting, 85mm lens..."'
          aria-label="Prompt"
          className="h-72 w-full resize-none bg-transparent text-base border-none outline-none focus:outline-none focus:ring-0 focus:border-0 shadow-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onToggleThemes}
            disabled={isGenerating}
            className={`flex items-center gap-2 rounded-full border px-1 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              hasSelectedTheme
                ? "border-blue-500 bg-white"
                : "border-muted bg-muted/40"
            } ${isGenerating ? "opacity-70" : "hover:-translate-y-0.5 hover:shadow"}`}
          >
            <div className="flex overflow-hidden rounded-full">
              {selectedThemeImages.slice(0, 3).map((path, index) => (
                <div
                  key={`${path}-${index}`}
                  className={`aspect-[1/1] w-11 overflow-hidden ${
                    index === 1 ? "mx-0.5" : ""
                  }`}
                >
                  <img
                    src={path}
                    alt="Theme preview"
                    className={`h-full w-full object-cover transition ${
                      hasSelectedTheme ? "opacity-100" : "opacity-40 grayscale"
                    }`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </button>
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

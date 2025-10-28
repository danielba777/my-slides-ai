"use client";

import { ChevronDown, Sparkles } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AiAvatarPromptInput({
  value,
  onChange,
  onGenerate,
  onToggleThemes,
  onQualityChange,
  quality,
  selectedThemeImages,
  hasSelectedTheme,
  isGenerating,
}: {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onToggleThemes: () => void;
  onQualityChange: (quality: "basic" | "high") => void;
  quality: "basic" | "high";
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
          <Select
            defaultValue={quality}
            value={quality}
            onValueChange={(value) =>
              onQualityChange(value as "basic" | "high")
            }
          >
            <SelectTrigger className="w-[140px] rounded-full border border-transparent bg-white px-3 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Quality
                </span>
                <div className="flex items-center gap-1 text-sm capitalize">
                  <SelectValue placeholder="high" />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border bg-white shadow-lg">
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
            </SelectContent>
          </Select>
          <span className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onToggleThemes}
              disabled={isGenerating}
              className={`flex items-center gap-2 rounded-full border px-1 py-1 transition focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
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
                        hasSelectedTheme
                          ? "opacity-100"
                          : "opacity-40 grayscale"
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
              className="h-12 gap-2 rounded-full px-7"
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
          </span>
        </div>
      </div>
    </div>
  );
}

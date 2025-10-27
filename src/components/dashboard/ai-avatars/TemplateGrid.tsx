"use client";

import { Button } from "@/components/ui/button";
import type { AiAvatarTemplate } from "@/types/ai-avatars";
import { useState } from "react";

type TemplateGridProps = {
  templates: AiAvatarTemplate[];
  onCopy?: (prompt: string) => void;
  showOpenInNewTab?: boolean;
};

const COLUMNS = 6;
const ROWS = 3;
const TOTAL_CELLS = COLUMNS * ROWS;

export function AiAvatarTemplateGrid({
  templates,
  onCopy,
  showOpenInNewTab = false,
}: TemplateGridProps) {
  const [addedId, setAddedId] = useState<string | null>(null);
  const visibleTemplates = templates.slice(0, TOTAL_CELLS);
  const placeholders = Math.max(TOTAL_CELLS - visibleTemplates.length, 0);

  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {visibleTemplates.map((template) => (
        <div
          key={template.id}
          className="relative aspect-[2/3] overflow-hidden rounded-2xl border bg-muted"
        >
          <img
            src={template.imageUrl || template.rawImageUrl || ""}
            alt="AI avatar template preview"
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
          {onCopy ? (
            <div className="absolute inset-x-0 bottom-0 p-3">
              <Button
                variant="outline"
                size="default"
                className="w-full gap-2 rounded-full bg-white text-zinc-900 text-lg font-medium hover:bg-zinc-100"
                onClick={() => {
                  onCopy?.(template.prompt);
                  setAddedId(template.id);
                  setTimeout(
                    () => setAddedId((id) => (id === template.id ? null : id)),
                    1500,
                  );
                }}
              >
                {addedId === template.id ? "Added!" : "Copy Prompt"}
              </Button>
            </div>
          ) : showOpenInNewTab ? (
            <div className="absolute inset-x-0 bottom-0 p-3">
              <Button
                variant="outline"
                size="default"
                className="w-full gap-2 rounded-full bg-white text-zinc-900 text-lg font-medium hover:bg-zinc-100"
                onClick={() => {
                  const targetUrl = template.imageUrl || template.rawImageUrl;
                  if (targetUrl) {
                    window.open(targetUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Open in new tab
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      {placeholders > 0 &&
        Array.from({ length: placeholders }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="aspect-[2/3] rounded-2xl border border-dashed bg-muted/60"
          />
        ))}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import type { AiAvatarTemplate } from "@/types/ai-avatars";
import { Copy } from "lucide-react";
import type { ReactNode } from "react";

export function AiAvatarTemplateGrid({
  templates,
  emptyState,
  onCopy,
}: {
  templates: AiAvatarTemplate[];
  emptyState?: ReactNode;
  onCopy: (prompt: string) => void;
}) {
  const columns = 6;
  const rows = 3;
  const totalCells = columns * rows;
  const placeholders = Math.max(totalCells - templates.length, 0);

  const visibleTemplates = templates.slice(0, totalCells);
  const shouldShowPlaceholdersOnly =
    visibleTemplates.length === 0 && placeholders === totalCells;

  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {visibleTemplates.map((template) => (
        <div key={template.id} className="relative aspect-[9/16] overflow-hidden rounded-2xl border bg-muted">
          <img
            src={template.imageUrl}
            alt="AI avatar template preview"
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 rounded-xl bg-background/80 text-xs font-medium"
              onClick={() => onCopy(template.prompt)}
            >
              <Copy className="h-3.5 w-3.5" />
              Get Prompt
            </Button>
          </div>
        </div>
      ))}
      {placeholders > 0 &&
        Array.from({ length: placeholders }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="aspect-[9/16] rounded-2xl border border-dashed bg-muted/60"
          />
        ))}

      {shouldShowPlaceholdersOnly && emptyState ? (
        <div className="col-span-full">
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {emptyState}
          </div>
        </div>
      ) : null}
    </div>
  );
}

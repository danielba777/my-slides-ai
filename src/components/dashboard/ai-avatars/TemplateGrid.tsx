"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AiAvatarTemplate } from "@/types/ai-avatars";
import { useEffect, useState } from "react";
import Image from "next/image";

type TemplateGridProps = {
  templates: AiAvatarTemplate[];
  onCopy?: (prompt: string) => void;
  showOpenInNewTab?: boolean;
  loadingPlaceholders?: Array<{ id: string; startedAt: number }>;
  rows?: number;
};

export const AI_AVATAR_GRID_COLUMNS = 6;
const DEFAULT_ROWS = 3;

export function AiAvatarTemplateGrid({
  templates,
  onCopy,
  showOpenInNewTab = false,
  loadingPlaceholders = [],
  rows = DEFAULT_ROWS,
}: TemplateGridProps) {
  const [addedId, setAddedId] = useState<string | null>(null);
  const safeRows = Math.max(Math.floor(rows), 1);
  const totalCells = AI_AVATAR_GRID_COLUMNS * safeRows;
  const maxTemplates = Math.max(totalCells - loadingPlaceholders.length, 0);
  const visibleTemplates = templates.slice(0, maxTemplates);

  const gridItems: Array<
    | { type: "loading"; placeholder: { id: string; startedAt: number } }
    | { type: "template"; template: AiAvatarTemplate }
  > = [
    ...loadingPlaceholders.map((placeholder) => ({
      type: "loading" as const,
      placeholder,
    })),
    ...visibleTemplates.map((template) => ({
      type: "template" as const,
      template,
    })),
  ];

  const placeholders = Math.max(totalCells - gridItems.length, 0);

  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {gridItems.map((item) =>
        item.type === "loading" ? (
          <GenerationLoadingCard
            key={`loading-${item.placeholder.id}`}
            startedAt={item.placeholder.startedAt}
          />
        ) : (
          <div
            key={item.template.id}
            className="relative aspect-[2/3] overflow-hidden rounded-2xl border bg-muted"
          >
            <Image
              src={item.template.imageUrl || item.template.rawImageUrl || ""}
              alt="AI avatar template preview"
              width={320}
              height={320}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
              quality={60}
              loading="lazy"
              sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 200px"
            />
            {onCopy ? (
              <div className="absolute inset-x-0 bottom-0 p-3">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full gap-2 rounded-full bg-white text-zinc-900 text-lg font-medium hover:bg-zinc-100"
                  onClick={() => {
                    onCopy?.(item.template.prompt);
                    setAddedId(item.template.id);
                    setTimeout(
                      () => setAddedId((id) => (id === item.template.id ? null : id)),
                      1500,
                    );
                  }}
                >
                  {addedId === item.template.id ? "Added!" : "Copy Prompt"}
                </Button>
              </div>
            ) : showOpenInNewTab ? (
              <div className="absolute inset-x-0 bottom-0 p-3">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full gap-2 rounded-full bg-white text-zinc-900 text-lg font-medium hover:bg-zinc-100"
                  onClick={() => {
                    const targetUrl =
                      item.template.imageUrl || item.template.rawImageUrl;
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
        ),
      )}

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

function GenerationLoadingCard({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [startedAt]);

  const formatted = formatElapsed(elapsed);

  return (
    <div className="flex aspect-[2/3] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40">
      <Spinner className="h-8 w-8 text-primary" />
      <span className="mt-4 text-sm font-medium text-muted-foreground">
        {formatted}
      </span>
    </div>
  );
}

function formatElapsed(durationMs: number) {
  const seconds = Math.max(durationMs, 0) / 1000;
  return `${seconds.toFixed(1)}s`;
}

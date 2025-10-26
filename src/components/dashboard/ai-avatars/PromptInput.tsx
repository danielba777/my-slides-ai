"use client";

import { Textarea } from "@/components/ui/textarea";

export function AiAvatarPromptInput({
  value,
  onChange,
  onShowTemplates,
}: {
  value: string;
  onChange: (value: string) => void;
  onShowTemplates: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-start gap-4">
        <h2 className="text-sm font-bold text-foreground">1. Prompt</h2>
      </div>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='z. B. "portrait of a fashion model, muted neon lighting, 85mm lens..."'
        className="h-72 w-full resize-none rounded-2xl border border-border bg-card px-4 py-3.5 text-base"
      />
    </div>
  );
}

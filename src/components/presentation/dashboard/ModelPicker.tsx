"use client";

import { setSelectedModel } from "@/hooks/presentation/useLocalModels";
import { usePresentationState } from "@/states/presentation-state";
import { Bot } from "lucide-react";
import { useEffect } from "react";

export function ModelPicker({
  shouldShowLabel = true,
}: {
  shouldShowLabel?: boolean;
}) {
  const { setModelProvider, setModelId } = usePresentationState();

  useEffect(() => {
    setModelProvider("openai");
    setModelId("");
    setSelectedModel("openai", "");
  }, [setModelProvider, setModelId]);

  return (
    <div>
      {shouldShowLabel && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Text Model
        </label>
      )}
      <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground">
        <Bot className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">GPT-4o-mini</span>
      </div>
    </div>
  );
}

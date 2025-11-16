"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { useCallback, useEffect, useState } from "react";

interface ImageSet {
  id: string;
  name: string;
  category: string;
  _count: { images: number };
}

export function PresentationControls({
  shouldShowLabel = true,
  className,
}: {
  shouldShowLabel?: boolean;
  className?: string;
}) {
  const {
    numSlides,
    setNumSlides,
    language,
    setLanguage,
    pageStyle,
    setPageStyle,
    slideCountMode,
    setSlideCountMode,
    imageSetId,
    setImageSetId,
    setImageSource,
  } = usePresentationState();

  const [imageSets, setImageSets] = useState<ImageSet[]>([]);

  const loadImageSets = useCallback(async () => {
    try {
      const response = await fetch("/api/imagesets");
      if (!response.ok) {
        throw new Error("Failed to fetch image sets");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setImageSets(data);
      } else {
        setImageSets([]);
      }
    } catch (error) {
      console.error("Error loading image sets:", error);
      setImageSets([]);
    }
  }, []);

  useEffect(() => {
    if (pageStyle !== "default") {
      setPageStyle("default");
    }
  }, [pageStyle, setPageStyle]);

  useEffect(() => {
    void loadImageSets();
  }, [loadImageSets]);

  return (
    <div className={cn("grid grid-cols-5 gap-4", className)}>
      {}

      {}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of slides
          </label>
        )}
        <Select
          value={slideCountMode === "auto" ? "auto" : String(numSlides)}
          onValueChange={(value) => {
            if (value === "auto") {
              setSlideCountMode("auto");
              return;
            }

            setSlideCountMode("manual");
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
              setNumSlides(parsed);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select number of slides" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num} slides
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Language
          </label>
        )}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en-US">English (US)</SelectItem>
            <SelectItem value="pt">Portuguese</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="ko">Korean</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
            <SelectItem value="ru">Russian</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {}
    </div>
  );
}

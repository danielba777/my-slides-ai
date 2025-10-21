import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePresentationState } from "@/states/presentation-state";
import { useEffect } from "react";

export function PresentationControls({
  shouldShowLabel = true,
}: {
  shouldShowLabel?: boolean;
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
  } = usePresentationState();

  useEffect(() => {
    if (pageStyle !== "default") {
      setPageStyle("default");
    }
  }, [pageStyle, setPageStyle]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* 
      <ModelPicker shouldShowLabel={shouldShowLabel} />
      */}

      {/* Number of Slides */}
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
            <SelectItem value="auto">Auto (use prompt)</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num} slides
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Language */}
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

      {/* 
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Page style
          </label>
        )}
        <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground">
          <Layout className="h-4 w-4" />
          <span className="truncate">Default</span>
        </div>
      </div>
      */}
    </div>
  );
}

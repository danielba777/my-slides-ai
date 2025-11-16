import { Button } from "@/components/ui/button";
import ColorPicker from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import {
  AlignCenter,
  ArrowUpFromLine,
  Edit,
  FoldVertical,
  Image,
  ImageIcon,
  LayoutGrid,
  MoveHorizontal,
  Trash2,
} from "lucide-react";
import { type LayoutType } from "../utils/parser";

interface SlideEditPopoverProps {
  index: number;
}

type ContentAlignment = "start" | "center" | "end";

export function SlideEditPopover({ index }: SlideEditPopoverProps) {
  const { slides, setSlides } = usePresentationState();
  const updateSlide = (
    updates: Partial<{
      layoutType: LayoutType;
      bgColor: string;
      width: "S" | "M" | "L";
      alignment: ContentAlignment;
      rootImage?: {
        query: string;
        url?: string;
      };
    }>,
  ) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = {
      ...updatedSlides[index]!,
      ...updates,
    };
    setSlides(updatedSlides);
  };

  const currentSlide = slides[index];
  const currentLayout = currentSlide?.layoutType ?? "background";
  const currentBgColor = currentSlide?.bgColor ?? "#4D4D4D";
  const currentWidth = currentSlide?.width ?? "M";
  const currentAlignment = currentSlide?.alignment ?? "start";
  const hasRootImage = !!currentSlide?.rootImage;

  const handleImageEdit = () => {
    
    
    updateSlide({
      rootImage: {
        query: "placeholder image",
        url: "https://placehold.co/600x400",
      },
    });
    alert("This would open the image selector in production");
  };

  const handleImageDelete = () => {
    updateSlide({ rootImage: { ...currentSlide?.rootImage!, url: undefined } });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-md bg-background/95 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground focus:outline-none focus-visible:outline-none"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-md border border-border bg-background"
        side="bottom"
      >
        <div className="space-y-2">
          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-current" />
              <span className="text-sm text-zinc-200">Card color</span>
            </div>
            <ColorPicker
              value={currentBgColor}
              onChange={(color) => updateSlide({ bgColor: color })}
            />
          </div>
          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {}
              <Image className="h-4 w-4" />
              <span className="text-sm text-zinc-200">Accent image</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-blue-500"
                onClick={handleImageEdit}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500"
                onClick={handleImageDelete}
                disabled={!hasRootImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlignCenter className="h-4 w-4"></AlignCenter>
              <span className="text-sm text-zinc-200">Content alignment</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentAlignment === "start" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ alignment: "start" })}
              >
                <ArrowUpFromLine className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentAlignment === "center" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ alignment: "center" })}
              >
                <FoldVertical className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentAlignment === "end" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ alignment: "end" })}
              >
                <ArrowUpFromLine className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm text-zinc-200">Bildlayout</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-zinc-800 bg-zinc-900",
                  currentLayout === "background" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ layoutType: "background" })}
              >
                <ImageIcon className="h-4 w-4"></ImageIcon>
              </Button>
            </div>
          </div>

          {}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoveHorizontal className="h-4 w-4"></MoveHorizontal>
              <span className="text-sm text-zinc-200">Card width</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-zinc-800 bg-zinc-900 px-2",
                  currentWidth === "S" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ width: "S" })}
              >
                S
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-zinc-800 bg-zinc-900 px-2",
                  currentWidth === "M" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ width: "M" })}
              >
                M
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-zinc-800 bg-zinc-900 px-2",
                  currentWidth === "L" && "bg-blue-600",
                )}
                onClick={() => updateSlide({ width: "L" })}
              >
                L
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

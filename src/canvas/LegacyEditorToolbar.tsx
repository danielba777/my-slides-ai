"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SlideTextElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check as CheckIcon,
  ChevronDown,
  ChevronUp,
  Bold as LucideBold,
  Plus,
} from "lucide-react";
import * as React from "react";
import { useCallback } from "react";
import {
  TIKTOK_BACKGROUND_COLOR,
  TIKTOK_BACKGROUND_MODE,
  TIKTOK_BACKGROUND_OPACITY,
  TIKTOK_BACKGROUND_PADDING,
  TIKTOK_BACKGROUND_RADIUS,
  TIKTOK_OUTLINE_COLOR,
  TIKTOK_OUTLINE_WIDTH,
  TIKTOK_TEXT_COLOR,
} from "./tiktokDefaults";

type TextBgMode = "block" | "blob";

type LegacyEditorToolbarProps = {
  /** Wird beim Klick auf „Text +" aufgerufen */
  onAddText?: () => void;
  /** Vorhandene (legacy) Controls werden hier gerendert */
  children: React.ReactNode;
  className?: string;
  selectedText?: SlideTextElement | null;
  // Patch kommt teils mit Zusatzfeldern aus der Toolbar (fill, stroke, fontWeight etc.)
  onChangeSelectedText?: (
    patch: Partial<SlideTextElement> & Record<string, unknown>,
  ) => void;
  /** Callback zum Schließen der Toolbar */
  onClose?: () => void;
  /** Toggle "Dim background" for the current slide (only BG image) */
  onToggleDim?: () => void;
};

/**
 * Ultra-kompakte, moderne Toolbar (iOS-like):
 * – Primärzeile mit: „+ Text", Ausrichtung, BG-Toggle (mit Mini-Panel)
 * – Legacy-Controls wandern sauber in ein Collapsible
 * – Breite: niemals größer als Parent (Canvas) – der Parent begrenzt das maxWidth
 */
function LegacyEditorToolbar({
  onAddText,
  children,
  className,
  selectedText,
  onChangeSelectedText,
  onClose,
  onToggleDim,
}: LegacyEditorToolbarProps) {
  const handleAdd = useCallback(() => {
    if (onAddText) return onAddText();
    window.dispatchEvent(new CustomEvent("canvas:add-text"));
  }, [onAddText]);

  const [textBgMode, setTextBgMode] =
    React.useState<TextBgMode>(TIKTOK_BACKGROUND_MODE);
  const [textBgPadding, setTextBgPadding] = React.useState(
    TIKTOK_BACKGROUND_PADDING,
  );
  const [textBgRadius, setTextBgRadius] = React.useState(
    TIKTOK_BACKGROUND_RADIUS,
  );
  // Default: 0 => Hintergrund aus
  const [textBgOpacity, setTextBgOpacity] = React.useState(0); // 0-100
  const [textBgColor, setTextBgColor] = React.useState<string>(
    TIKTOK_BACKGROUND_COLOR,
  );

  const hasSelection = !!selectedText;
  const selectedBackground = selectedText?.background;
  const selectedFontWeight =
    (selectedText as any)?.fontWeight ??
    (selectedText as any)?.weight ??
    "normal";
  const isBold = !!hasSelection && String(selectedFontWeight) === "bold";
  const selectedFontStyle =
    (selectedText as any)?.fontStyle ??
    ((selectedText as any)?.italic ? "italic" : "normal");
  const isItalic = hasSelection && selectedFontStyle === "italic";
  const activeAlign = ((selectedText as any)?.align ??
    selectedText?.align ??
    "left") as "left" | "center" | "right";
  const outlineEnabled =
    (selectedText as any)?.strokeEnabled ??
    (selectedText as any)?.outlineEnabled ??
    ((selectedText as any)?.strokeWidth ?? 0) > 0;
  const bgEnabled =
    !!selectedBackground && (selectedBackground.opacity ?? 0) > 0;

  React.useEffect(() => {
    if (!selectedBackground) {
      setTextBgMode(TIKTOK_BACKGROUND_MODE);
      setTextBgPadding(TIKTOK_BACKGROUND_PADDING);
      setTextBgRadius(TIKTOK_BACKGROUND_RADIUS);
      setTextBgOpacity(0);
      setTextBgColor(TIKTOK_BACKGROUND_COLOR);
      return;
    }
    setTextBgMode(selectedBackground.mode ?? TIKTOK_BACKGROUND_MODE);
    setTextBgPadding(
      selectedBackground.paddingX ?? TIKTOK_BACKGROUND_PADDING,
    );
    setTextBgRadius(selectedBackground.radius ?? TIKTOK_BACKGROUND_RADIUS);
    setTextBgOpacity(Math.round((selectedBackground.opacity ?? 0) * 100));
    setTextBgColor(selectedBackground.color ?? TIKTOK_BACKGROUND_COLOR);
  }, [
    selectedText?.id,
    selectedBackground?.mode,
    selectedBackground?.paddingX,
    selectedBackground?.radius,
    selectedBackground?.opacity,
    selectedBackground?.color,
  ]);

  const buildBackground = useCallback(
    (overrides?: Partial<SlideTextElement["background"]>) => {
      const rawOpacity = overrides?.opacity ?? textBgOpacity / 100;
      const nextOpacity = Math.min(1, Math.max(0, rawOpacity));
      const fallbackPadding =
        overrides?.paddingX ??
        overrides?.paddingY ??
        textBgPadding ??
        TIKTOK_BACKGROUND_PADDING;
      return {
        // "enabled" wird implizit ueber Opazitaet gesteuert:
        enabled: nextOpacity > 0,
        mode: overrides?.mode ?? textBgMode ?? TIKTOK_BACKGROUND_MODE,
        color:
          overrides?.color ??
          textBgColor ??
          TIKTOK_BACKGROUND_COLOR,
        opacity: nextOpacity,
        paddingX: overrides?.paddingX ?? fallbackPadding,
        paddingY: overrides?.paddingY ?? fallbackPadding,
        radius:
          overrides?.radius ??
          textBgRadius ??
          TIKTOK_BACKGROUND_RADIUS,
        lineOverlap:
          overrides?.lineOverlap ?? selectedBackground?.lineOverlap ?? 0,
      };
    },
    [
      textBgMode,
      textBgColor,
      textBgOpacity,
      textBgPadding,
      textBgRadius,
      selectedBackground?.lineOverlap,
    ],
  );

  const commitBackground = useCallback(
    (overrides?: Partial<SlideTextElement["background"]>) => {
      if (!onChangeSelectedText) return;
      onChangeSelectedText({ background: buildBackground(overrides) });
    },
    [buildBackground, onChangeSelectedText],
  );

  // Kein expliziter Toggle mehr nötig – Opazität 0 = aus, >0 = an

  const handleModeChange = useCallback(
    (mode: TextBgMode) => {
      setTextBgMode(mode);
      if (!hasSelection) return;
      commitBackground({ mode });
    },
    [commitBackground, hasSelection],
  );

  // 🔁 Bold toggeln (an/aus) – Status in Button widerspiegeln
  const toggleBold = () => {
    if (!hasSelection) return;
    const next = String(selectedFontWeight) === "bold" ? "regular" : "bold";
    onChangeSelectedText?.({
      ...selectedText!,
      weight: next,
      fontWeight: next,
    });
  };
  const setAlign = (a: "left" | "center" | "right") =>
    onChangeSelectedText?.({ ...selectedText!, align: a });

  // ✅ Schöne, klare Custom-Icons für Outline / Background (weißes „A")
  const IconTextOutlineA = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <filter id="stroke" colorInterpolationFilters="sRGB">
          <feMorphology
            operator="dilate"
            radius="1.2"
            in="SourceAlpha"
            result="DILATE"
          />
          <feColorMatrix
            type="matrix"
            values="
             0 0 0 0 0
             0 0 0 0 0
             0 0 0 0 0
             0 0 0 1 0"
            in="DILATE"
            result="BLACK"
          />
          <feMerge>
            <feMergeNode in="BLACK" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#stroke)">
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontWeight="700"
          fontSize="14"
          fill="#fff"
        >
          A
        </text>
      </g>
    </svg>
  );
  const IconTextBackgroundA = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="11"
        rx="2.5"
        fill="currentColor"
        opacity="0.25"
      ></rect>
      <text
        x="12"
        y="15"
        textAnchor="middle"
        fontWeight="700"
        fontSize="14"
        fill="#fff"
      >
        A
      </text>
    </svg>
  );

  
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-border/60 bg-background/80 backdrop-blur-md shadow-sm supports-backdrop-blur:bg-background/60",
        className,
      )}
      role="toolbar"
      aria-label="Canvas toolbar"
    >
      {/* === TikTok-Style: Add Text + Outline Toggle + Text BG Toggle === */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* Add text */}
          <Button
            variant="secondary"
            className="rounded-xl px-3"
            onClick={handleAdd}
            aria-label="Add text"
            title="Add text"
          >
            <Plus className="mr-1 h-4 w-4" /> Text
          </Button>

          {/* Text outline (toggle, unified styling) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Text outline"
            aria-pressed={outlineEnabled}
            className={cn("h-9 w-9", outlineEnabled && "bg-muted")}
            onClick={() => {
              if (!hasSelection) return;
              const currentColor =
                (selectedText as any)?.stroke ??
                (selectedText as any)?.outlineColor ??
                TIKTOK_OUTLINE_COLOR;
              if (outlineEnabled) {
                onChangeSelectedText?.({
                  ...selectedText!,
                  strokeEnabled: false,
                  outlineEnabled: false,
                  strokeWidth: 0,
                  outlineWidth: TIKTOK_OUTLINE_WIDTH,
                  stroke: currentColor,
                  outlineColor: currentColor,
                });
                return;
              }
              onChangeSelectedText?.({
                ...selectedText!,
                strokeEnabled: true,
                outlineEnabled: true,
                strokeWidth: TIKTOK_OUTLINE_WIDTH,
                outlineWidth: TIKTOK_OUTLINE_WIDTH,
                stroke: currentColor,
                outlineColor: currentColor,
              });
            }}
            title="Toggle text outline"
          >
            <IconTextOutlineA className="h-4 w-4" />
          </Button>

          {/* Text background (toggle, unified styling) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Text background"
            aria-pressed={bgEnabled}
            className={cn("h-9 w-9", bgEnabled && "bg-muted")}
            onClick={() => {
              if (!hasSelection) return;
              if (bgEnabled) {
                setTextBgOpacity(0);
                onChangeSelectedText?.({
                  ...selectedText!,
                  background: {
                    ...(selectedBackground ?? {}),
                    opacity: 0,
                    enabled: false,
                    paddingX: TIKTOK_BACKGROUND_PADDING,
                    paddingY: TIKTOK_BACKGROUND_PADDING,
                    radius: TIKTOK_BACKGROUND_RADIUS,
                    mode: TIKTOK_BACKGROUND_MODE,
                    color:
                      selectedBackground?.color ??
                      textBgColor ??
                      TIKTOK_BACKGROUND_COLOR,
                  },
                });
                return;
              }
              const nextColor =
                selectedBackground?.color ??
                textBgColor ??
                TIKTOK_BACKGROUND_COLOR;
              setTextBgMode(TIKTOK_BACKGROUND_MODE);
              setTextBgPadding(TIKTOK_BACKGROUND_PADDING);
              setTextBgRadius(TIKTOK_BACKGROUND_RADIUS);
              setTextBgOpacity(Math.round(TIKTOK_BACKGROUND_OPACITY * 100));
              setTextBgColor(nextColor);
              const nextBackground = {
                enabled: true,
                mode: TIKTOK_BACKGROUND_MODE,
                color: nextColor,
                opacity: TIKTOK_BACKGROUND_OPACITY,
                paddingX: TIKTOK_BACKGROUND_PADDING,
                paddingY: TIKTOK_BACKGROUND_PADDING,
                radius: TIKTOK_BACKGROUND_RADIUS,
                lineOverlap: selectedBackground?.lineOverlap ?? 0,
              } as SlideTextElement["background"];
              onChangeSelectedText?.({
                ...selectedText!,
                background: nextBackground,
              });
            }}
            title="Toggle text background"
          >
            <IconTextBackgroundA className="h-4 w-4" />
          </Button>

          {/* Bold (toggle) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Bold"
            aria-pressed={isBold}
            className={cn("h-9 w-9", isBold && "bg-muted")}
            onClick={toggleBold}
            title="Bold"
          >
            <LucideBold className="h-4 w-4" />
          </Button>

          {/* Text-Ausrichtung (kompakt als Overlay-Menü) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                disabled={!hasSelection}
                className="rounded-xl px-2.5 py-1"
                title="Text alignment"
                aria-label="Text alignment"
              >
                {activeAlign === "left" && <AlignLeft className="h-4 w-4" />}
                {activeAlign === "center" && (
                  <AlignCenter className="h-4 w-4" />
                )}
                {activeAlign === "right" && <AlignRight className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="z-[60] rounded-xl border bg-popover/95 backdrop-blur supports-backdrop-blur:bg-popover/75"
            >
              <DropdownMenuItem
                onClick={() =>
                  hasSelection &&
                  onChangeSelectedText?.({ ...selectedText!, align: "left" })
                }
                className={cn("gap-2", activeAlign === "left" && "bg-muted")}
              >
                <AlignLeft className="h-4 w-4" /> Left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  hasSelection &&
                  onChangeSelectedText?.({ ...selectedText!, align: "center" })
                }
                className={cn("gap-2", activeAlign === "center" && "bg-muted")}
              >
                <AlignCenter className="h-4 w-4" /> Center
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  hasSelection &&
                  onChangeSelectedText?.({ ...selectedText!, align: "right" })
                }
                className={cn("gap-2", activeAlign === "right" && "bg-muted")}
              >
                <AlignRight className="h-4 w-4" /> Right
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Done Button - rechts oben */}
        {onClose && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="rounded-full bg-green-500 hover:bg-green-600"
            aria-label="Done editing"
            title="Done editing"
          >
            <CheckIcon className="h-5 w-5 text-white" />
          </Button>
        )}
      </div>

      {/* Sekundärzeile: vereinfachte "Optionen" */}
      <div className="border-t px-3">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between rounded-xl"
            >
              Advanced Options
              <ChevronDown className="h-4 w-4 data-[state=open]:hidden" />
              <ChevronUp className="hidden h-4 w-4 data-[state=open]:block" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            <div className="flex flex-wrap items-center gap-4 py-1.5">
              {/* Farben als gefüllte Swatches + größere Labels */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[72px]">
                  Text
                </span>
                <input
                  type="color"
                  value={(selectedText as any)?.fill ?? TIKTOK_TEXT_COLOR}
                  onChange={(e) =>
                    hasSelection &&
                    onChangeSelectedText?.({
                      ...selectedText!,
                      fill: e.currentTarget.value,
                    })
                  }
                  className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[72px]">
                  Background
                </span>
                <input
                  type="color"
                  value={textBgColor}
                  onChange={(e) => {
                    const c = e.currentTarget.value;
                    setTextBgColor(c);
                    commitBackground({
                      color: c,
                      opacity: textBgOpacity / 100,
                    });
                  }}
                  className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[72px]">
                  Outline
                </span>
                <input
                  type="color"
                  value={
                    (selectedText as any)?.stroke ??
                    (selectedText as any)?.outlineColor ??
                    TIKTOK_OUTLINE_COLOR
                  }
                  onChange={(e) =>
                    hasSelection &&
                    onChangeSelectedText?.({
                      ...selectedText!,
                      stroke: e.currentTarget.value,
                      outlineColor: e.currentTarget.value,
                      strokeWidth:
                        ((selectedText as any)?.strokeWidth ?? 0) > 0
                          ? (selectedText as any)?.strokeWidth
                          : TIKTOK_OUTLINE_WIDTH,
                      outlineWidth:
                        ((selectedText as any)?.strokeWidth ?? 0) > 0
                          ? (selectedText as any)?.strokeWidth
                          : TIKTOK_OUTLINE_WIDTH,
                      strokeEnabled: true,
                      outlineEnabled: true,
                    })
                  }
                  className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl ml-auto"
                title="Dim background"
                onClick={
                  onToggleDim ??
                  (() =>
                    window.dispatchEvent(new CustomEvent("canvas:toggle-dim")))
                }
              >
                Dim background
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
export default LegacyEditorToolbar;

// -------- Mini Range Control (kompakt & einheitlich) ----------
function MiniRange({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.currentTarget.value))}
        className="h-1.5 w-24"
      />
    </div>
  );
}


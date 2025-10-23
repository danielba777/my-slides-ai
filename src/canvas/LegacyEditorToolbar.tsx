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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { SlideTextElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Paintbrush,
  Plus,
} from "lucide-react";
import * as React from "react";
import { useCallback } from "react";

type TextBgMode = "block" | "blob";

type LegacyEditorToolbarProps = {
  /** Wird beim Klick auf „Text +“ aufgerufen */
  onAddText?: () => void;
  /** Vorhandene (legacy) Controls werden hier gerendert */
  children: React.ReactNode;
  className?: string;
  selectedText?: SlideTextElement | null;
  onChangeSelectedText?: (patch: Partial<SlideTextElement>) => void;
};

/**
 * - Kompakte, einzeilige Toolbar (iOS-inspired):
 * - – Primäre Aktionen in einer Zeile
 * - – Sekundäres in Collapsibles
 * - – Text-Hintergrund UI (Block/Blob) vorbereitet – emit via CustomEvent
 * - window.dispatchEvent(new CustomEvent("canvas:text-bg", { detail: { enabled, mode } }))
 * - Breite: nie größer als Parent/Canvas (w-full max-w-full min-w-0 + overflow-x-auto).
 */
function LegacyEditorToolbar({
  onAddText,
  children,
  className,
  selectedText,
  onChangeSelectedText,
}: LegacyEditorToolbarProps) {
  const handleAdd = useCallback(() => {
    if (onAddText) return onAddText();
    window.dispatchEvent(new CustomEvent("canvas:add-text"));
  }, [onAddText]);

  const [textBgEnabled, setTextBgEnabled] = React.useState(false);
  const [textBgMode, setTextBgMode] = React.useState<TextBgMode>("block");
  const [textBgPadding, setTextBgPadding] = React.useState(12);
  const [textBgRadius, setTextBgRadius] = React.useState(12);
  const [textBgOpacity, setTextBgOpacity] = React.useState(55); // 0-100
  const [textBgColor, setTextBgColor] = React.useState<string>("#000000");

  const hasSelection = !!selectedText;
  const selectedBackground = selectedText?.background;

  React.useEffect(() => {
    if (!selectedBackground) {
      setTextBgEnabled(false);
      setTextBgMode("block");
      setTextBgPadding(12);
      setTextBgRadius(12);
      setTextBgOpacity(55);
      setTextBgColor("#000000");
      return;
    }
    setTextBgEnabled(!!selectedBackground.enabled);
    setTextBgMode(selectedBackground.mode ?? "block");
    setTextBgPadding(selectedBackground.paddingX ?? 12);
    setTextBgRadius(selectedBackground.radius ?? 12);
    setTextBgOpacity(Math.round((selectedBackground.opacity ?? 0.55) * 100));
    setTextBgColor(selectedBackground.color ?? "#000000");
  }, [
    selectedText?.id,
    selectedBackground?.enabled,
    selectedBackground?.mode,
    selectedBackground?.paddingX,
    selectedBackground?.radius,
    selectedBackground?.opacity,
    selectedBackground?.color,
  ]);

  const buildBackground = useCallback(
    (overrides?: Partial<SlideTextElement["background"]>) => ({
      enabled: overrides?.enabled ?? textBgEnabled,
      mode: overrides?.mode ?? textBgMode,
      color: overrides?.color ?? textBgColor,
      opacity: overrides?.opacity ?? textBgOpacity / 100,
      paddingX: overrides?.paddingX ?? textBgPadding,
      paddingY: overrides?.paddingY ?? textBgPadding,
      radius: overrides?.radius ?? textBgRadius,
      lineOverlap:
        overrides?.lineOverlap ?? selectedBackground?.lineOverlap ?? 0,
    }),
    [
      textBgEnabled,
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

  const handleToggleBg = useCallback(
    (v: boolean) => {
      setTextBgEnabled(v);
      if (!hasSelection) return;
      commitBackground({ enabled: v });
    },
    [commitBackground, hasSelection],
  );

  const handleModeChange = useCallback(
    (mode: TextBgMode) => {
      setTextBgMode(mode);
      if (!hasSelection) return;
      commitBackground({ mode });
    },
    [commitBackground, hasSelection],
  );

  return (
    <div
      className={cn("mx-auto w-full max-w-full min-w-0", className)}
      /* Container begrenzt sich an Parent/Canvas */
    >
      <div
        className={cn(
          "sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        )}
      >
        {/* Primary row (eine Zeile) */}
        <div className="flex h-12 items-center gap-2 px-3 overflow-x-auto">
          {/* Add Text */}
          <Button
            variant="default"
            size="sm"
            className="rounded-2xl shrink-0"
            onClick={handleAdd}
            aria-label="Text hinzufügen"
            title="Text hinzufügen"
          >
            <Plus className="mr-2 h-4 w-4" />
            Text
          </Button>

          <Separator
            orientation="vertical"
            className="mx-1 hidden h-6 sm:block"
          />

          {/* Text Background – UI + Live Config */}
          <div className="flex items-center gap-2 rounded-xl border px-2 py-1">
            <Paintbrush className="h-4 w-4" />
            <span className="text-xs">Text BG</span>
            <Switch
              checked={textBgEnabled}
              onCheckedChange={handleToggleBg}
              aria-label="Text-Hintergrund ein/aus"
              disabled={!hasSelection}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  disabled={!textBgEnabled || !hasSelection}
                >
                  {textBgMode === "blob" ? "Blob" : "Block"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuLabel>Background Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleModeChange("block")}>
                  Block
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleModeChange("blob")}>
                  Blob
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CONFIG: Padding / Radius / Opacity / Color */}
            <Separator orientation="vertical" className="mx-2 h-6" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Pad</span>
              <div className="w-24">
                <Slider
                  value={[textBgPadding]}
                  min={0}
                  max={48}
                  step={1}
                  onValueChange={(v) => {
                    const next = v[0] ?? 0;
                    setTextBgPadding(next);
                    if (!hasSelection) return;
                    commitBackground({ paddingX: next, paddingY: next });
                  }}
                  disabled={!textBgEnabled || !hasSelection}
                />
              </div>
              <span className="text-[11px] w-5 text-right tabular-nums">
                {textBgPadding}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Rad</span>
              <div className="w-24">
                <Slider
                  value={[textBgRadius]}
                  min={0}
                  max={48}
                  step={1}
                  onValueChange={(v) => {
                    const next = v[0] ?? 0;
                    setTextBgRadius(next);
                    if (!hasSelection) return;
                    commitBackground({ radius: next });
                  }}
                  disabled={!textBgEnabled || !hasSelection}
                />
              </div>
              <span className="text-[11px] w-5 text-right tabular-nums">
                {textBgRadius}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Opacity</span>
              <div className="w-24">
                <Slider
                  value={[textBgOpacity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => {
                    const next = v[0] ?? 0;
                    setTextBgOpacity(next);
                    if (!hasSelection) return;
                    commitBackground({ opacity: next / 100 });
                  }}
                  disabled={!textBgEnabled || !hasSelection}
                />
              </div>
              <span className="text-[11px] w-7 text-right tabular-nums">
                {textBgOpacity}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Color</span>
              <input
                type="color"
                value={textBgColor}
                onChange={(e) => {
                  const next = e.currentTarget.value;
                  setTextBgColor(next);
                  if (!hasSelection) return;
                  commitBackground({ color: next });
                }}
                disabled={!textBgEnabled || !hasSelection}
                className="h-7 w-8 cursor-pointer rounded-md border border-border bg-background p-0.5"
                aria-label="Text-Hintergrundfarbe"
                title="Text-Hintergrundfarbe"
              />
            </div>
          </div>

          {/* Beispiel-Ausrichtung (optional in Zukunft an Bindings anknüpfen) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl">
                Align
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem>
                <AlignLeft className="mr-2 h-4 w-4" /> Left
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AlignCenter className="mr-2 h-4 w-4" /> Center
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AlignRight className="mr-2 h-4 w-4" /> Right
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Spacer + Overflow */}
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-2xl">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>More</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Smart Guides</DropdownMenuItem>
                <DropdownMenuItem>Snapping</DropdownMenuItem>
                <DropdownMenuItem>Rulers</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Secondary row (Collapsibles) */}
        <div className="border-t px-3">
          <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
            {/* Platz für zukünftige Gruppen (Typo, Arrange, etc.) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  Legacy Controls
                  <ChevronDown className="ml-1 h-4 w-4 data-[state=open]:hidden" />
                  <ChevronUp className="ml-1 hidden h-4 w-4 data-[state=open]:block" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {/* Deine bisherigen Controls bleiben funktional erhalten */}
                <div className="flex flex-wrap items-center gap-2 py-2 min-w-0">
                  {children}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LegacyEditorToolbar;

Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/canvas/LegacyEditorToolbar.tsx
@@
-"use client";

- -import React from "react";
- -export default function LegacyEditorToolbar() {
- return (
- <div className="w-full border-b bg-background p-4">
-      {/* existing, tall multi-row toolbar ... */}
- </div>
- );
  -}
  +"use client";

* +import React, { useMemo } from "react";
  +import { cn } from "@/lib/utils";
  +import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
  +import { Button } from "@/components/ui/button";
  +import { Switch } from "@/components/ui/switch";
  +import {
* DropdownMenu,
* DropdownMenuContent,
* DropdownMenuItem,
* DropdownMenuLabel,
* DropdownMenuSeparator,
* DropdownMenuTrigger,
  +} from "@/components/ui/dropdown-menu";
  +import { Separator } from "@/components/ui/separator";
  +import {
* Bold,
* Italic,
* Underline,
* Type,
* AlignLeft,
* AlignCenter,
* AlignRight,
* ChevronDown,
* ChevronUp,
* Layers,
* Square,
* Image as ImageIcon,
* Undo2,
* Redo2,
* ZoomIn,
* ZoomOut,
* MoreHorizontal,
* Paintbrush,
  +} from "lucide-react";
* +/\*\*
* - Compact, modern, single-row toolbar (inspired by iOS 18 design language):
* - - Primary row holds the most-used actions
* - - Secondary controls live in collapsible groups to save vertical space
* - - Adds "Text Background" toggle with two modes: Block / Blob (UI only for now)
* -
* - Backward-compatible props: all are optional. If you already handle these in a parent,
* - pass handlers to keep state in sync. If not provided, the toolbar manages nothing functional.
* \*/
  +type TextBgMode = "block" | "blob";
  +type Props = {
* className?: string;
* // Optional handlers for host to wire functionality
* onBold?: () => void;
* onItalic?: () => void;
* onUnderline?: () => void;
* onAlign?: (v: "left" | "center" | "right") => void;
* onInsertShape?: () => void;
* onInsertImage?: () => void;
* onUndo?: () => void;
* onRedo?: () => void;
* onZoomIn?: () => void;
* onZoomOut?: () => void;
* // New: Text Background controls (UI only in this patch)
* textBgEnabled?: boolean;
* textBgMode?: TextBgMode;
* onTextBgChange?: (enabled: boolean, mode: TextBgMode) => void;
  +};
* +export default function LegacyEditorToolbar({
* className,
* onBold,
* onItalic,
* onUnderline,
* onAlign,
* onInsertShape,
* onInsertImage,
* onUndo,
* onRedo,
* onZoomIn,
* onZoomOut,
* textBgEnabled = false,
* textBgMode = "block",
* onTextBgChange,
  +}: Props) {
* const AlignIcon = useMemo(() => {
* switch (true) {
*      default:
*        return AlignLeft;
* }
* }, []);
*
* // Local helpers for text background UI
* const handleToggleTextBg = (val: boolean) => {
* onTextBgChange?.(val, textBgMode);
* };
* const handleModeChange = (mode: TextBgMode) => {
* onTextBgChange?.(textBgEnabled, mode);
* };
*
* return (
* <div
*      className={cn(
*        "sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
*        className,
*      )}
* >
*      {/* Primary Row — one line, dense controls */}
*      <div className="flex h-12 items-center gap-2 px-3">
*        {/* Left cluster: Insert */}
*        <div className="flex items-center gap-1">
*          <Button variant="secondary" size="sm" className="rounded-2xl" onClick={onInsertShape}>
*            <Square className="mr-1 h-4 w-4" />
*            Shape
*          </Button>
*          <Button variant="secondary" size="sm" className="rounded-2xl" onClick={onInsertImage}>
*            <ImageIcon className="mr-1 h-4 w-4" />
*            Image
*          </Button>
*        </div>
*
*        <Separator orientation="vertical" className="mx-1 h-6" />
*
*        {/* Typography quick actions */}
*        <div className="flex items-center gap-1">
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBold} aria-label="Bold">
*            <Bold className="h-4 w-4" />
*          </Button>
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onItalic} aria-label="Italic">
*            <Italic className="h-4 w-4" />
*          </Button>
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onUnderline} aria-label="Underline">
*            <Underline className="h-4 w-4" />
*          </Button>
*
*          <DropdownMenu>
*            <DropdownMenuTrigger asChild>
*              <Button variant="ghost" size="sm" className="rounded-xl">
*                <Type className="mr-2 h-4 w-4" />
*                Align
*                <ChevronDown className="ml-1 h-4 w-4" />
*              </Button>
*            </DropdownMenuTrigger>
*            <DropdownMenuContent align="start" className="w-40">
*              <DropdownMenuItem onClick={() => onAlign?.("left")}>
*                <AlignLeft className="mr-2 h-4 w-4" />
*                Left
*              </DropdownMenuItem>
*              <DropdownMenuItem onClick={() => onAlign?.("center")}>
*                <AlignCenter className="mr-2 h-4 w-4" />
*                Center
*              </DropdownMenuItem>
*              <DropdownMenuItem onClick={() => onAlign?.("right")}>
*                <AlignRight className="mr-2 h-4 w-4" />
*                Right
*              </DropdownMenuItem>
*            </DropdownMenuContent>
*          </DropdownMenu>
*        </div>
*
*        <Separator orientation="vertical" className="mx-1 h-6" />
*
*        {/* Text Background — NEW */}
*        <div className="flex items-center gap-2 rounded-xl border px-2 py-1">
*          <Paintbrush className="h-4 w-4" />
*          <span className="text-xs">Text BG</span>
*          <Switch
*            checked={textBgEnabled}
*            onCheckedChange={handleToggleTextBg}
*            aria-label="Toggle text background"
*          />
*          <DropdownMenu>
*            <DropdownMenuTrigger asChild>
*              <Button variant="ghost" size="sm" className="rounded-xl" disabled={!textBgEnabled}>
*                {textBgMode === "blob" ? "Blob" : "Block"}
*                <ChevronDown className="ml-1 h-4 w-4" />
*              </Button>
*            </DropdownMenuTrigger>
*            <DropdownMenuContent align="start" className="w-36">
*              <DropdownMenuLabel>Background Mode</DropdownMenuLabel>
*              <DropdownMenuSeparator />
*              <DropdownMenuItem onClick={() => handleModeChange("block")}>Block</DropdownMenuItem>
*              <DropdownMenuItem onClick={() => handleModeChange("blob")}>Blob</DropdownMenuItem>
*            </DropdownMenuContent>
*          </DropdownMenu>
*        </div>
*
*        <div className="ml-auto flex items-center gap-1">
*          {/* Canvas controls */}
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onZoomOut} aria-label="Zoom out">
*            <ZoomOut className="h-4 w-4" />
*          </Button>
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onZoomIn} aria-label="Zoom in">
*            <ZoomIn className="h-4 w-4" />
*          </Button>
*          <Separator orientation="vertical" className="mx-1 h-6" />
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onUndo} aria-label="Undo">
*            <Undo2 className="h-4 w-4" />
*          </Button>
*          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onRedo} aria-label="Redo">
*            <Redo2 className="h-4 w-4" />
*          </Button>
*
*          {/* Overflow / More */}
*          <DropdownMenu>
*            <DropdownMenuTrigger asChild>
*              <Button variant="secondary" size="icon" className="ml-1 rounded-2xl">
*                <MoreHorizontal className="h-4 w-4" />
*              </Button>
*            </DropdownMenuTrigger>
*            <DropdownMenuContent align="end" className="w-56">
*              <DropdownMenuLabel>More</DropdownMenuLabel>
*              <DropdownMenuSeparator />
*              <DropdownMenuItem>
*                <Layers className="mr-2 h-4 w-4" />
*                Arrange / Layers
*              </DropdownMenuItem>
*              <DropdownMenuItem>Smart Guides</DropdownMenuItem>
*              <DropdownMenuItem>Snapping</DropdownMenuItem>
*              <DropdownMenuItem>Rulers</DropdownMenuItem>
*            </DropdownMenuContent>
*          </DropdownMenu>
*        </div>
*      </div>
*
*      {/* Secondary Row — collapsible groups keep it airy and compact */}
*      <div className="border-t px-3">
*        <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
*          <Collapsible>
*            <div className="flex items-center gap-1">
*              <CollapsibleTrigger asChild>
*                <Button variant="ghost" size="sm" className="rounded-xl">
*                  Typography
*                  <ChevronDown className="ml-1 h-4 w-4 data-[state=open]:hidden" />
*                  <ChevronUp className="ml-1 hidden h-4 w-4 data-[state=open]:block" />
*                </Button>
*              </CollapsibleTrigger>
*            </div>
*            <CollapsibleContent>
*              <div className="flex flex-wrap items-center gap-2 py-2">
*                {/* Place existing font family / size / line-height controls here if you have them.
*                    Keeping UI placeholders minimal to avoid breaking existing logic. */}
*                <Button size="sm" variant="outline" className="rounded-xl">Font</Button>
*                <Button size="sm" variant="outline" className="rounded-xl">Size</Button>
*                <Button size="sm" variant="outline" className="rounded-xl">Line</Button>
*                <Button size="sm" variant="outline" className="rounded-xl">Spacing</Button>
*              </div>
*            </CollapsibleContent>
*          </Collapsible>
*
*          <Collapsible>
*            <CollapsibleTrigger asChild>
*              <Button variant="ghost" size="sm" className="rounded-xl">
*                Arrange
*                <ChevronDown className="ml-1 h-4 w-4 data-[state=open]:hidden" />
*                <ChevronUp className="ml-1 hidden h-4 w-4 data-[state=open]:block" />
*              </Button>
*            </CollapsibleTrigger>
*            <CollapsibleContent>
*              <div className="flex flex-wrap items-center gap-2 py-2">
*                <Button size="sm" variant="outline" className="rounded-xl">Forward</Button>
*                <Button size="sm" variant="outline" className="rounded-xl">Backward</Button>
*                <Button size="sm" variant="outline" className="rounded-xl">To Front</Button>
*                <Button size="sm" variant="outline" className="rounded-xl">To Back</Button>
*              </div>
*            </CollapsibleContent>
*          </Collapsible>
*        </div>
*      </div>
* </div>
* );
  +}
  \*\*\* End Patch

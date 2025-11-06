"use client";

import { ThemeBackground } from "@/components/presentation/theme/ThemeBackground";
import { type ThemeProperties } from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import type React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { CustomThemeFontLoader } from "./FontLoader";
import { LoadingState } from "./Loading";
import { SlidePreview } from "./SlidePreview";

interface PresentationLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
  themeData?: ThemeProperties;
  isShared?: boolean;
  hideSidebar?: boolean;
  fixedBackgroundColor?: string; // Neue Prop für feste Hintergrundfarbe
}

export function PresentationLayout({
  children,
  isLoading = false,
  themeData,
  isShared = false,
  hideSidebar = false,
  fixedBackgroundColor,
}: PresentationLayoutProps) {
  const isPresenting = usePresentationState((s) => s.isPresenting);

  // Sidebar interactions moved to SlidePreview

  if (isLoading) {
    return <LoadingState />;
  }

  // Hide sidebar in shared mode and when presenting
  const showSidebar = !hideSidebar && !isShared && !isPresenting;

  const backgroundElement = fixedBackgroundColor ? (
    <div className="h-full w-full" style={{ backgroundColor: fixedBackgroundColor }}>
      <DndProvider backend={HTML5Backend}>
        {themeData && <CustomThemeFontLoader themeData={themeData} />}
        <div className="flex h-full">
          {showSidebar && <SlidePreview showSidebar={showSidebar} />}
          {/* Main Presentation Content - Scrollable */}
          <div className="presentation-slides flex max-h-full flex-1 items-start overflow-x-auto overflow-y-hidden pb-20">
            {children}
          </div>
        </div>
      </DndProvider>
    </div>
  ) : (
    <ThemeBackground className="h-full w-full">
      <DndProvider backend={HTML5Backend}>
        {themeData && <CustomThemeFontLoader themeData={themeData} />}
        <div className="flex h-full">
          {showSidebar && <SlidePreview showSidebar={showSidebar} />}
          {/* Main Presentation Content - Scrollable */}
          <div className="presentation-slides flex max-h-full flex-1 items-start overflow-x-auto overflow-y-hidden pb-20">
            {children}
          </div>
        </div>
      </DndProvider>
    </ThemeBackground>
  );

  return backgroundElement;
}

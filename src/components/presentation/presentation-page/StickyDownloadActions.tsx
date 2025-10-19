"use client";

import React from "react";
import { DownloadSlidesButton } from "./buttons/DownloadSlidesButton";

/**
 * Fixierter Aktionsbereich oben rechts im Viewport,
 * damit der Download-Button immer erreichbar bleibt – auch bei horizontalem Scrollen.
 */
export default function StickyDownloadActions() {
  return (
    <div
      className="
        fixed top-4 right-4 z-50
        flex items-center gap-2
      "
    >
      <DownloadSlidesButton />
    </div>
  );
}
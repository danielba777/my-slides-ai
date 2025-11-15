"use client";

import React from "react";
import { PostNowButton } from "./buttons/PostNowButton";

/**
 * Fixierter Aktionsbereich oben rechts im Viewport,
 * damit der Post-Button mit Download-Option immer erreichbar bleibt – auch bei horizontalem Scrollen.
 */
export default function StickyDownloadActions() {
  return (
    <div
      className="
        fixed top-4 right-4 z-50
        flex items-center gap-2
      "
    >
      <PostNowButton />
    </div>
  );
}
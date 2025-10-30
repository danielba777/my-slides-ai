"use client";

import { create } from "zustand";

interface SlidePreviewItem {
  id: string;
  index: number;
  dataUrl: string;
}

export interface PreparedSlideshowPost {
  presentationId: string | null;
  presentationTitle: string;
  defaultCaption: string;
  zipDataUrl: string | null;
  slides: SlidePreviewItem[];
  preparedAt: number;
}

interface SlideshowPostState {
  prepared: PreparedSlideshowPost | null;
  setPrepared: (data: PreparedSlideshowPost) => void;
  reset: () => void;
}

export const useSlideshowPostState = create<SlideshowPostState>((set) => ({
  prepared: null,
  setPrepared: (data) => set({ prepared: data }),
  reset: () => set({ prepared: null }),
}));

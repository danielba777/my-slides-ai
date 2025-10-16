"use client";

import React from "react";

type Props = {
  id: string;
  children: React.ReactNode;
};

// Wichtig: Kein useSortable hier.
// Damit ist die Slide NICHT mehr als Ganzes draggable.
// Dragging erfolgt ausschließlich über den Handle in SlideContainer (setActivatorNodeRef).
export function SortableSlide({ children }: Props) {
  return <div>{children}</div>;
}

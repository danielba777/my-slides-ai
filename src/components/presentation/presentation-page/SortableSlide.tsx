"use client";

import React from "react";

type Props = {
  id: string;
  children: React.ReactNode;
};




export function SortableSlide({ children }: Props) {
  return <div>{children}</div>;
}

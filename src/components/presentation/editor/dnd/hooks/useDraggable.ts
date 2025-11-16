
import React from "react";

import { useEditorRef } from "platejs/react";

import { DRAG_ITEM_BLOCK } from "@platejs/dnd";
import { type UseDndNodeOptions, useDndNode } from "./useDndNode";

export type DraggableState = {
  
  isAboutToDrag: boolean;
  isDragging: boolean;
  
  nodeRef: React.RefObject<HTMLDivElement | null>;
  
  previewRef: React.RefObject<HTMLDivElement | null>;
  
  handleRef: (
    elementOrNode:
      | Element
      | React.ReactElement<any>
      | React.RefObject<any>
      | null,
  ) => void;
};

export const useDraggable = (props: UseDndNodeOptions): DraggableState => {
  const { type = DRAG_ITEM_BLOCK, orientation, onDropHandler } = props;

  const editor = useEditorRef();

  const nodeRef = React.useRef<HTMLDivElement>(null);

  const multiplePreviewRef = React.useRef<HTMLDivElement>(null);

  if (!editor.plugins.dnd) return {} as any;

  
  const { dragRef, isAboutToDrag, isDragging } = useDndNode({
    multiplePreviewRef,
    nodeRef,
    type,
    onDropHandler,
    orientation,
    ...props,
  });

  return {
    isAboutToDrag,
    isDragging,
    nodeRef,
    previewRef: multiplePreviewRef,
    handleRef: dragRef,
  };
};


import { getEmptyImage, NativeTypes } from "react-dnd-html5-backend";

import { type ConnectDragSource, type DropTargetMonitor } from "react-dnd";

import { type PlateEditor, useEditorRef } from "platejs/react";

import { type DragItemNode } from "@platejs/dnd";

import { DRAG_ITEM_BLOCK } from "@platejs/dnd";
import { type UseDragNodeOptions, useDragNode } from "./useDragNode";
import { type UseDropNodeOptions, useDropNode } from "./useDropNode";

export type UseDndNodeOptions = Pick<UseDropNodeOptions, "element"> &
  Partial<
    Pick<
      UseDropNodeOptions,
      "canDropNode" | "multiplePreviewRef" | "nodeRef" | "orientation"
    >
  > &
  Partial<Pick<UseDragNodeOptions, "type">> & {
    
    drag?: Partial<Omit<UseDragNodeOptions, "type">>;
    
    drop?: Partial<
      Omit<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">
    >;
    preview?: {
      
      disable?: boolean;
      
      ref?: any;
    };
    onDropHandler?: (
      editor: PlateEditor,
      props: {
        id: string;
        dragItem: DragItemNode;
        monitor: DropTargetMonitor<DragItemNode, unknown>;
        nodeRef: any;
      },
    ) => boolean | undefined;
  };


export const useDndNode = ({
  canDropNode,
  drag: dragOptions,
  drop: dropOptions,
  element,
  multiplePreviewRef,
  nodeRef,
  preview: previewOptions = {},
  type = DRAG_ITEM_BLOCK,
  orientation,
  onDropHandler,
}: UseDndNodeOptions): {
  dragRef: ConnectDragSource;
  isAboutToDrag: boolean;
  isDragging: boolean;
  isOver: boolean;
} => {
  const editor = useEditorRef();

  const [{ isAboutToDrag, isDragging }, dragRef, preview] = useDragNode(
    editor,
    {
      element,
      type,
      orientation,
      ...dragOptions,
    },
  );

  
  const [{ isOver }, drop] = useDropNode(editor, {
    accept: [type, NativeTypes.FILE],
    canDropNode,
    element,
    multiplePreviewRef,
    nodeRef,
    onDropHandler,
    orientation,
    ...dropOptions,
  });

  
  drop(nodeRef);

  
  if (previewOptions.disable) {
    preview(getEmptyImage(), { captureDraggingState: true });
  } else if (previewOptions.ref) {
    preview(previewOptions.ref);
  } else {
    preview(multiplePreviewRef);
  }

  return {
    dragRef,
    isAboutToDrag,
    isDragging,
    isOver,
  };
};

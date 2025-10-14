/** biome-ignore-all lint/suspicious/noExplicitAny: This use requires any */
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
    /** Options passed to the drag hook. */
    drag?: Partial<Omit<UseDragNodeOptions, "type">>;
    /** Options passed to the drop hook, excluding element, nodeRef. */
    drop?: Partial<
      Omit<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">
    >;
    preview?: {
      /** Whether to disable the preview. */
      disable?: boolean;
      /** The reference to the preview element. */
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

/**
 * {@link useDragNode} and {@link useDropNode} hooks to drag and drop a node from
 * the editor. A default preview is used to show the node being dragged, which
 * can be customized or removed. Returns the drag ref and drop line direction.
 *
 * This version supports multi-directional dragging - vertical for reordering
 * and horizontal for creating columns.
 */
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

  // Remove orientation from drop options to support multi-directional
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

  // Always use nodeRef for the drop target (actual DOM element)
  drop(nodeRef);

  // Handle preview based on options and whether we're dragging multiple nodes
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

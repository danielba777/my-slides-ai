
import {
  type DropTargetHookSpec,
  type DropTargetMonitor,
  useDrop,
} from "react-dnd";

import { type NodeEntry, type TElement } from "platejs";
import { type PlateEditor } from "platejs/react";

import {
  type DragItemNode,
  type ElementDragItemNode,
  type FileDragItemNode,
} from "@platejs/dnd";

import { MultiDndPlugin } from "@/components/plate/plugins/dnd-kit";
import { onDropNode } from "../transforms/onDropNode";
import { onHoverNode } from "../transforms/onHoverNode";
import { getDropPath } from "../utils/getDropPath";
export type CanDropCallback = (args: {
  dragEntry: NodeEntry<TElement>;
  dragItem: DragItemNode;
  dropEntry: NodeEntry<TElement>;
  editor: PlateEditor;
}) => boolean;

export interface UseDropNodeOptions
  extends DropTargetHookSpec<DragItemNode, unknown, { isOver: boolean }> {
  
  element: TElement;

  
  nodeRef: any;

  
  multiplePreviewRef: any;

  orientation?: "vertical" | "horizontal";
  
  canDropNode?: CanDropCallback;

  
  onDropHandler?: (
    editor: PlateEditor,
    props: {
      id: string;
      dragItem: DragItemNode;
      monitor: DropTargetMonitor<DragItemNode, unknown>;
      nodeRef: any;
    },
  ) => boolean | undefined;
}


export const useDropNode = (
  editor: PlateEditor,
  {
    canDropNode,
    element,
    nodeRef,
    onDropHandler,
    ...options
  }: UseDropNodeOptions,
) => {
  const id = element.id as string;

  return useDrop<DragItemNode, unknown, { isOver: boolean }>({
    collect: (monitor) => ({
      isOver: monitor.isOver({
        shallow: true,
      }),
    }),
    drop: (dragItem, monitor) => {
      
      if (!(dragItem as ElementDragItemNode).id) {
        const result = getDropPath(editor, {
          canDropNode,
          dragItem,
          element,
          monitor,
          nodeRef,
        });

        const onDropFiles = editor.getOptions(MultiDndPlugin).onDropFiles;

        if (!result || !onDropFiles) return;

        return onDropFiles({
          id,
          dragItem: dragItem as FileDragItemNode,
          editor,
          monitor,
          nodeRef,
          target: result.to,
        });
      }

      const handled =
        !!onDropHandler &&
        onDropHandler(editor, {
          id,
          dragItem,
          monitor,
          nodeRef,
        });

      if (handled) return;

      onDropNode(editor, {
        canDropNode,
        dragItem: dragItem as ElementDragItemNode,
        element,
        monitor,
        nodeRef,
      });
    },
    hover(item: DragItemNode, monitor: DropTargetMonitor) {
      onHoverNode(editor, {
        canDropNode,
        dragItem: item,
        element,
        monitor,
        nodeRef,
      });
    },
    ...options,
  });
};

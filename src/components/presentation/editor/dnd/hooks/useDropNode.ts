/** biome-ignore-all lint/suspicious/noExplicitAny: This use requires any */
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
  /** The node to which the drop line is attached. */
  element: TElement;

  /** The reference to the node being dragged. */
  nodeRef: any;

  /** The reference to the multiple preview element */
  multiplePreviewRef: any;

  orientation?: "vertical" | "horizontal";
  /**
   * Intercepts the drop handling. If `false` is returned, the default drop
   * behavior is called after. If `true` is returned, the default behavior is
   * not called.
   */
  canDropNode?: CanDropCallback;

  /**
   * Handler for custom drop behavior
   */
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

/**
 * `useDrop` hook to drop a node on the editor.
 * Supports multi-directional drops without orientation constraint.
 *
 * On drop:
 * - Get hover direction (top, bottom, left, right), return early if undefined
 * - For vertical (top/bottom): reorder nodes
 * - For horizontal (left/right): create columns
 * - DragPath: find node with id = dragItem.id, return early if not found
 * - Focus editor
 * - Move or insert nodes based on direction
 *
 * On hover:
 * - Get drop line direction
 * - If differs from dropLine, setDropLine is called
 *
 * Collect:
 * - IsOver: true if mouse is over the block
 */
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
      // Don't call onDropNode if this is a file drop
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

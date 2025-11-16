import { type PlateEditor } from "platejs/react";
import { type DropTargetMonitor } from "react-dnd";

import { type NodeEntry, type Path, type TElement, PathApi } from "platejs";

import { MultiDndPlugin } from "@/components/plate/plugins/dnd-kit";
import { type DragItemNode } from "@platejs/dnd";
import { type UseDropNodeOptions } from "../hooks";
import { getHoverDirection } from "./getHoverDirection";


export const getDropPath = (
  editor: PlateEditor,
  {
    canDropNode,
    dragItem,
    element,
    monitor,
    nodeRef,
  }: {
    dragItem: DragItemNode;
    monitor: DropTargetMonitor;
  } & Pick<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">,
) => {
  const { orientation } = editor.getOptions(MultiDndPlugin);
  
  const direction = getHoverDirection({
    dragItem,
    element,
    monitor,
    nodeRef,
    orientation,
  });

  if (!direction) return;

  let dragEntry: NodeEntry<TElement> | undefined;
  let dropEntry: NodeEntry<TElement> | undefined;

  if ("element" in dragItem) {
    const dragPath = editor.api.findPath(dragItem.element);
    const hoveredPath = editor.api.findPath(element);

    if (!hoveredPath) return;

    
    
    if (dragPath) {
      dragEntry = [dragItem.element, dragPath];
    }

    dropEntry = [element, hoveredPath];
  } else {
    dropEntry = editor.api.node<TElement>({ id: element.id as string, at: [] });
  }

  if (!dropEntry) return;

  
  if (
    canDropNode &&
    dragEntry &&
    !canDropNode({ dragEntry, dragItem, dropEntry, editor })
  ) {
    return;
  }

  const dragPath = dragEntry?.[1];
  const hoveredPath = dropEntry[1];

  
  if (direction === "left" || direction === "right") {
    
    return {
      direction,
      dragPath,
      hoveredPath,
      to: hoveredPath,
      isExternalNode: !dragPath,
    };
  }

  
  let dropPath: Path | undefined;

  if (direction === "bottom") {
    
    dropPath = hoveredPath;

    
    if (dragPath && PathApi.equals(dragPath, PathApi.next(dropPath))) return;
  }

  if (direction === "top") {
    
    dropPath = [...hoveredPath.slice(0, -1), hoveredPath.at(-1)! - 1];

    
    if (dragPath && PathApi.equals(dragPath, dropPath)) return;
  }

  if (!dropPath) return;

  const before =
    dragPath &&
    PathApi.isBefore(dragPath, dropPath) &&
    PathApi.isSibling(dragPath, dropPath);
  const to = before ? dropPath : PathApi.next(dropPath);

  
  return {
    direction,
    dragPath,
    to,
    hoveredPath,
    isExternalNode: !dragPath,
  };
};

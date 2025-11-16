
import { type TElement } from "platejs";
import { type DropTargetMonitor, type XYCoord } from "react-dnd";

import {
  type DragItemNode,
  type DropDirection,
  type ElementDragItemNode,
} from "@platejs/dnd";

export interface GetHoverDirectionOptions {
  dragItem: DragItemNode;

  
  element: TElement;

  monitor: DropTargetMonitor;

  
  nodeRef: any;

  orientation?: "vertical" | "horizontal";
  
}


export const getHoverDirection = ({
  dragItem,
  element,
  monitor,
  nodeRef,
  orientation: _,
}: GetHoverDirectionOptions): DropDirection => {
  if (!nodeRef.current) return;

  
  if (element === (dragItem as ElementDragItemNode).element) return;

  
  const elementDragItem = dragItem as ElementDragItemNode;
  const draggedIds = Array.isArray(elementDragItem.id)
    ? elementDragItem.id
    : [elementDragItem.id];
  if (draggedIds.includes(element.id as string)) return;

  const HORIZONTAL_THRESHOLD = 40;

  const hoverBoundingRect = nodeRef.current?.getBoundingClientRect();
  if (!hoverBoundingRect) return;

  const clientOffset = monitor.getClientOffset();
  if (!clientOffset) return;

  
  

  
  
  
  

  
  
  

  
  
  
  
  
  
  
  
  const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left;
  const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

  if (hoverClientX < HORIZONTAL_THRESHOLD) {
    return "left";
  }

  
  const hoverMiddleX = (hoverBoundingRect.left + hoverBoundingRect.width) / 2;
  
  if (hoverClientX > hoverMiddleX + HORIZONTAL_THRESHOLD) {
    return "right";
  }

  
  const hoverMiddleY = hoverBoundingRect.height / 2;
  return hoverClientY < hoverMiddleY ? "top" : "bottom";
  
};

import { useElement, usePluginOptions } from "platejs/react";

import { MultiDndPlugin } from "@/components/plate/plugins/dnd-kit";
import { type DropLineDirection } from "@platejs/dnd";

export const useDropLine = ({
  id: idProp,
}: {
  
  id?: string;
} = {}): {
  dropLine?: DropLineDirection;
} => {
  const element = useElement();
  const id = idProp || (element.id as string);

  const dropLine =
    usePluginOptions(MultiDndPlugin, ({ dropTarget }) => {
      if (!dropTarget) return null;
      if (dropTarget.id !== id) return null;

      return dropTarget.line;
    }) ?? "";

  
  return {
    dropLine,
  };
};

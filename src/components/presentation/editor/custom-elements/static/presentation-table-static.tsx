import type * as React from "react";

import {
  type SlateElementProps,
  type TTableCellElement,
  type TTableElement,
} from "platejs";

import { BaseTablePlugin } from "@platejs/table";
import { SlateElement } from "platejs";

import { cn } from "@/lib/utils";

export function PresentationTableElementStatic({
  children,
  ...props
}: SlateElementProps<TTableElement>) {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin);
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft;

  return (
    <SlateElement
      {...props}
      className="presentation-element overflow-x-auto py-5"
      style={{ paddingLeft: marginLeft }}
    >
      <div className="group/table relative w-full bg-transparent">
        <table className="ml-px mr-0 table h-px w-full max-w-[calc(100%-2rem)] table-fixed border-collapse bg-transparent text-[var(--presentation-text)]">
          <tbody className="w-full">{children}</tbody>
        </table>
      </div>
    </SlateElement>
  );
}

export function PresentationTableRowElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props} as="tr" className="h-full">
      {props.children}
    </SlateElement>
  );
}

export function PresentationTableCellElementStatic({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { editor, element } = props;
  const { api } = editor.getPlugin(BaseTablePlugin);

  const { minHeight } = api.table.getCellSize({ element });
  const borders = api.table.getCellBorders({ element });

  return (
    <SlateElement
      {...props}
      as={isHeader ? "th" : "td"}
      className={cn(
        "h-full overflow-visible border-none bg-transparent p-0",
        element.background ? "bg-(--cellBackground)" : "bg-transparent",
        isHeader && "text-left *:m-0",
        "before:size-full",
        "before:absolute before:box-border before:select-none before:content-['']",
        borders.bottom?.size && `before:border-b before:border-b-border`,
        borders.right?.size && `before:border-r before:border-r-border`,
        borders.left?.size && `before:border-l before:border-l-border`,
        borders.top?.size && `before:border-t before:border-t-border`,
      )}
      style={
        {
          "--cellBackground": element.background,
          ...(isHeader && {
            backgroundColor: element.color || "var(--presentation-primary)",
          }),
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
      }}
    >
      <div
        className={cn(
          "relative z-20 box-border h-full rounded-md px-3 py-2",
          isHeader ? "text-lg font-bold text-primary" : "presentation-text",
        )}
        style={{ minHeight }}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}

export function PresentationTableCellHeaderElementStatic(
  props: SlateElementProps<TTableCellElement>,
) {
  return <PresentationTableCellElementStatic {...props} isHeader />;
}

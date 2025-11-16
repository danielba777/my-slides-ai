import { createPlatePlugin } from "platejs/react";
import { ARROW_LIST, ARROW_LIST_ITEM } from "../lib";

import { type TElement } from "platejs";
import { ArrowItem } from "../custom-elements/arrow-item";
import ArrowList from "../custom-elements/arrow-list";

export const ArrowListPlugin = createPlatePlugin({
  key: ARROW_LIST,
  node: {
    isElement: true,
    component: ArrowList,
  },
});


export const ArrowListItemPlugin = createPlatePlugin({
  key: ARROW_LIST_ITEM,
  node: {
    isElement: true,
    component: ArrowItem,
  },
  options: {
    visualizationType: "arrow",
  },
});

export type TArrowListElement = TElement & { type: typeof ARROW_LIST };
export type TArrowListItemElement = TElement & { type: typeof ARROW_LIST_ITEM };

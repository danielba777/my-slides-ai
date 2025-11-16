
import { type TElement } from "platejs";
import { createTPlatePlugin } from "platejs/react";
import Pyramid from "../custom-elements/pyramid";
import { PyramidItem } from "../custom-elements/pyramid-item";
import { PYRAMID_GROUP, PYRAMID_ITEM } from "../lib";


export const PyramidGroupPlugin = createTPlatePlugin({
  key: PYRAMID_GROUP,
  node: {
    isElement: true,
    component: Pyramid,
  },
  options: {
    totalChildren: 0,
  },
});


export const PyramidItemPlugin = createTPlatePlugin({
  key: PYRAMID_ITEM,
  node: {
    isElement: true,
    component: PyramidItem,
  },
});


export interface TPyramidGroupElement extends TElement {
  type: typeof PYRAMID_GROUP;
  totalChildren?: number; 
}

export interface TPyramidItemElement extends TElement {
  type: typeof PYRAMID_ITEM;
}

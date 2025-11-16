import { type TElement } from "platejs";
import { createTPlatePlugin } from "platejs/react";
import Staircase from "../custom-elements/staircase";
import { StairItem } from "../custom-elements/staircase-item";
import { STAIR_ITEM, STAIRCASE_GROUP } from "../lib";


export const StaircaseGroupPlugin = createTPlatePlugin({
  key: STAIRCASE_GROUP,
  node: {
    isElement: true,
    type: STAIRCASE_GROUP,
    isContainer: true,
    component: Staircase,
  },
  options: {
    totalChildren: 0,
  },
});


export const StairItemPlugin = createTPlatePlugin({
  key: STAIR_ITEM,
  node: {
    isElement: true,
    isVoid: false,
    type: STAIR_ITEM,
    component: StairItem,
  },
});


export interface TStairGroupElement extends TElement {
  type: typeof STAIRCASE_GROUP;
  totalChildren?: number; 
}

export interface TStairItemElement extends TElement {
  type: typeof STAIR_ITEM;
}

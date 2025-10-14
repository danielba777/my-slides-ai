import { createTPlatePlugin } from "platejs/react";
import {
  ARROW_LIST,
  ARROW_LIST_ITEM,
  BEFORE_AFTER_GROUP,
  BEFORE_AFTER_SIDE,
  BOX_GROUP,
  BOX_ITEM,
  BULLET_GROUP,
  BULLET_ITEM,
  BUTTON_ELEMENT,
  COMPARE_GROUP,
  COMPARE_SIDE,
  CONS_ITEM,
  CYCLE_GROUP,
  CYCLE_ITEM,
  ICON_ELEMENT,
  ICON_LIST,
  ICON_LIST_ITEM,
  PROS_CONS_GROUP,
  PROS_ITEM,
  PYRAMID_GROUP,
  PYRAMID_ITEM,
  SEQUENCE_ARROW_GROUP,
  SEQUENCE_ARROW_ITEM,
  STAIRCASE_GROUP,
  STAIR_ITEM,
  TIMELINE_GROUP,
  TIMELINE_ITEM,
} from "../lib";

import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin,
} from "@platejs/table";
import VisualizationItemElementStatic from "../custom-elements/legacy/visualization-item-static";
import VisualizationListElementStatic from "../custom-elements/legacy/visualization-list-static";
import { ArrowItemStatic } from "../custom-elements/static/arrow-item-static";
import ArrowListStatic from "../custom-elements/static/arrow-list-static";
import { BeforeAfterSideStatic } from "../custom-elements/static/before-after-side-static";
import BeforeAfterGroupStatic from "../custom-elements/static/before-after-static";
import { BoxItemStatic } from "../custom-elements/static/box-item-static";
import BoxGroupStatic from "../custom-elements/static/box-static";
import { BulletItemStatic } from "../custom-elements/static/bullet-item-static";
import { BulletsElementStatic } from "../custom-elements/static/bullet-static";
import ButtonStatic from "../custom-elements/static/button-static";
import { CompareSideStatic } from "../custom-elements/static/compare-side-static";
import CompareGroupStatic from "../custom-elements/static/compare-static";
import { ConsItemStatic } from "../custom-elements/static/cons-item-static";
import { CycleElementStatic } from "../custom-elements/static/cycle-element-static";
import { CycleItemStatic } from "../custom-elements/static/cycle-item-static";
import { GeneratingLeafStatic } from "../custom-elements/static/generating-leaf-static";
import { IconListItemStatic } from "../custom-elements/static/icon-list-item-static";
import { IconListStatic } from "../custom-elements/static/icon-list-static";
import { IconStatic } from "../custom-elements/static/icon-static";
import {
  PresentationTableCellElementStatic,
  PresentationTableCellHeaderElementStatic,
  PresentationTableElementStatic,
  PresentationTableRowElementStatic,
} from "../custom-elements/static/presentation-table-static";
import ProsConsGroupStatic from "../custom-elements/static/pros-cons-static";
import { ProsItemStatic } from "../custom-elements/static/pros-item-static";
import { PyramidItemStatic } from "../custom-elements/static/pyramid-item-static";
import PyramidStatic from "../custom-elements/static/pyramid-static";
import { SequenceArrowItemStatic } from "../custom-elements/static/sequence-arrow-item-static";
import SequenceArrowStatic from "../custom-elements/static/sequence-arrow-static";
import { StairItemStatic } from "../custom-elements/static/staircase-item-static";
import StaircaseStatic from "../custom-elements/static/staircase-static";
import { TimelineItemStatic } from "../custom-elements/static/timeline-item-static";
import TimelineStatic from "../custom-elements/static/timeline-static";
import {
  AreaChartStaticPlugin,
  BarChartStaticPlugin,
  LineChartStaticPlugin,
  PieChartStaticPlugin,
  RadarChartStaticPlugin,
  ScatterChartStaticPlugin,
} from "./chart-plugin";
export const PresentationStaticCustomKit = [
  createTPlatePlugin({
    key: ARROW_LIST,
    node: { isElement: true, component: ArrowListStatic },
  }),
  createTPlatePlugin({
    key: ARROW_LIST_ITEM,
    node: { isElement: true, component: ArrowItemStatic },
  }),
  createTPlatePlugin({
    key: BULLET_GROUP,
    node: { isElement: true, component: BulletsElementStatic },
  }),
  createTPlatePlugin({
    key: BULLET_ITEM,
    node: { isElement: true, component: BulletItemStatic },
  }),
  createTPlatePlugin({
    key: STAIRCASE_GROUP,
    node: { isElement: true, component: StaircaseStatic },
  }),
  createTPlatePlugin({
    key: STAIR_ITEM,
    node: { isElement: true, component: StairItemStatic },
  }),
  createTPlatePlugin({
    key: CYCLE_GROUP,
    node: { isElement: true, component: CycleElementStatic },
  }),
  createTPlatePlugin({
    key: CYCLE_ITEM,
    node: { isElement: true, component: CycleItemStatic },
  }),
  createTPlatePlugin({
    key: ICON_ELEMENT,
    node: { isElement: true, component: IconStatic },
  }),
  createTPlatePlugin({
    key: ICON_LIST,
    node: { isElement: true, component: IconListStatic },
  }),
  createTPlatePlugin({
    key: ICON_LIST_ITEM,
    node: { isElement: true, component: IconListItemStatic },
  }),
  createTPlatePlugin({
    key: PYRAMID_GROUP,
    node: { isElement: true, component: PyramidStatic },
  }),
  createTPlatePlugin({
    key: PYRAMID_ITEM,
    node: { isElement: true, component: PyramidItemStatic },
  }),
  createTPlatePlugin({
    key: TIMELINE_GROUP,
    node: { isElement: true, component: TimelineStatic },
  }),
  createTPlatePlugin({
    key: TIMELINE_ITEM,
    node: { isElement: true, component: TimelineItemStatic },
  }),
  // Box
  createTPlatePlugin({
    key: BOX_GROUP,
    node: { isElement: true, component: BoxGroupStatic },
  }),
  createTPlatePlugin({
    key: BOX_ITEM,
    node: { isElement: true, component: BoxItemStatic },
  }),
  // Compare
  createTPlatePlugin({
    key: COMPARE_GROUP,
    node: { isElement: true, component: CompareGroupStatic },
  }),
  createTPlatePlugin({
    key: COMPARE_SIDE,
    node: { isElement: true, component: CompareSideStatic },
  }),
  // Before/After
  createTPlatePlugin({
    key: BEFORE_AFTER_GROUP,
    node: { isElement: true, component: BeforeAfterGroupStatic },
  }),
  createTPlatePlugin({
    key: BEFORE_AFTER_SIDE,
    node: { isElement: true, component: BeforeAfterSideStatic },
  }),
  // Pros & Cons
  createTPlatePlugin({
    key: PROS_CONS_GROUP,
    node: { isElement: true, component: ProsConsGroupStatic },
  }),
  createTPlatePlugin({
    key: PROS_ITEM,
    node: { isElement: true, component: ProsItemStatic },
  }),
  createTPlatePlugin({
    key: CONS_ITEM,
    node: { isElement: true, component: ConsItemStatic },
  }),
  // Arrow Vertical
  createTPlatePlugin({
    key: SEQUENCE_ARROW_GROUP,
    node: { isElement: true, component: SequenceArrowStatic },
  }),
  createTPlatePlugin({
    key: SEQUENCE_ARROW_ITEM,
    node: { isElement: true, component: SequenceArrowItemStatic },
  }),
  // Button
  createTPlatePlugin({
    key: BUTTON_ELEMENT,
    node: { isElement: true, component: ButtonStatic },
  }),
  // Legacy adapters
  createTPlatePlugin({
    key: "visualization-list",
    node: { isElement: true, component: VisualizationListElementStatic },
  }),
  createTPlatePlugin({
    key: "visualization-item",
    node: { isElement: true, component: VisualizationItemElementStatic },
  }),

  BaseTablePlugin.withComponent(PresentationTableElementStatic),
  BaseTableRowPlugin.withComponent(PresentationTableRowElementStatic),
  BaseTableCellPlugin.withComponent(PresentationTableCellElementStatic),
  BaseTableCellHeaderPlugin.withComponent(
    PresentationTableCellHeaderElementStatic,
  ),

  // Removed generic chart element router per request
  // Individual static chart elements
  PieChartStaticPlugin,
  BarChartStaticPlugin,
  AreaChartStaticPlugin,
  RadarChartStaticPlugin,
  ScatterChartStaticPlugin,
  LineChartStaticPlugin,
  // Leaf for generating caret in static mode
  createTPlatePlugin({
    key: "generating",
    node: { isLeaf: true, component: GeneratingLeafStatic },
  }),
];

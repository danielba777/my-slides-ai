import type { CanvasDoc } from "@/canvas/types";
import { ColumnItemPlugin, ColumnPlugin } from "@platejs/layout/react";
import { nanoid } from "nanoid"; 
import {
  type Descendant,
  type TColumnElement,
  type TColumnGroupElement,
  type TText,
} from "platejs";
import {
  type TArrowListElement,
  type TArrowListItemElement,
} from "../editor/plugins/arrow-plugin";
import {
  type TBulletGroupElement,
  type TBulletItemElement,
} from "../editor/plugins/bullet-plugin";
import {
  type TCycleGroupElement,
  type TCycleItemElement,
} from "../editor/plugins/cycle-plugin";
import {
  type TIconListElement,
  type TIconListItemElement,
} from "../editor/plugins/icon-list-plugin";
import { type TIconElement } from "../editor/plugins/icon-plugin";
import {
  type TPyramidGroupElement,
  type TPyramidItemElement,
} from "../editor/plugins/pyramid-plugin";
import {
  type TStairGroupElement,
  type TStairItemElement,
} from "../editor/plugins/staircase-plugin";
import {
  type TTimelineGroupElement,
  type TTimelineItemElement,
} from "../editor/plugins/timeline-plugin";

import {
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
} from "platejs";
import {
  AREA_CHART_ELEMENT,
  BAR_CHART_ELEMENT,
  LINE_CHART_ELEMENT,
  PIE_CHART_ELEMENT,
  RADAR_CHART_ELEMENT,
  SCATTER_CHART_ELEMENT,
} from "../editor/lib";
import {
  type TBeforeAfterGroupElement,
  type TBeforeAfterSideElement,
} from "../editor/plugins/before-after-plugin";
import {
  type TBoxGroupElement,
  type TBoxItemElement,
} from "../editor/plugins/box-plugin";
import { type TButtonElement } from "../editor/plugins/button-plugin";
import {
  type TCompareGroupElement,
  type TCompareSideElement,
} from "../editor/plugins/compare-plugin";
import {
  type TConsItemElement,
  type TProsConsGroupElement,
  type TProsItemElement,
} from "../editor/plugins/pros-cons-plugin";
import {
  type TSequenceArrowGroupElement,
  type TSequenceArrowItemElement,
} from "../editor/plugins/sequence-arrow-plugin";
import {
  type GeneratingText,
  type HeadingElement,
  type ImageCropSettings,
  type ImageElement,
  type ParagraphElement,
  type TChartElement,
} from "./types";


export type PlateNode =
  | ParagraphElement
  | HeadingElement
  | ImageElement
  | TColumnElement
  | TColumnGroupElement
  | TBulletGroupElement
  | TBulletItemElement
  | TIconListItemElement
  | TIconListElement
  | TIconElement
  | TCycleGroupElement
  | TCycleItemElement
  | TStairItemElement
  | TStairGroupElement
  | TPyramidGroupElement
  | TPyramidItemElement
  | TArrowListElement
  | TArrowListItemElement
  | TTimelineGroupElement
  | TTimelineItemElement
  | TChartElement
  
  | TBoxGroupElement
  | TBoxItemElement
  | TCompareGroupElement
  | TCompareSideElement
  | TBeforeAfterGroupElement
  | TBeforeAfterSideElement
  | TProsConsGroupElement
  | TProsItemElement
  | TConsItemElement
  | TSequenceArrowGroupElement
  | TSequenceArrowItemElement
  | TButtonElement
  | TTableElement
  | TTableRowElement
  | TTableCellElement;

export type LayoutType = "left" | "right" | "vertical" | "background";
export type ImageGridItem = {
  url?: string;
  query?: string;
  cropSettings?: ImageCropSettings;
};
export type RootImage = {
  query: string;
  url?: string;
  cropSettings?: ImageCropSettings;
  layoutType?: LayoutType;
  size?: { w?: string; h?: number };
  
  useGrid?: boolean;
  gridImages?: ImageGridItem[];
  
  imageSetId?: string;
  imageSetName?: string;
  parentImageSetId?: string | null;
  parentImageSetName?: string | null;
  imageCategory?: string | null;
};

export type PlateSlide = {
  id: string;
  content: PlateNode[];
  rootImage?: RootImage;
  layoutType?: LayoutType | undefined;
  alignment?: "start" | "center" | "end";
  bgColor?: string;
  width?: "S" | "M" | "L";
  position?: { x: number; y: number };
  canvas?: CanvasDoc | null;
};


interface XMLNode {
  tag: string;
  attributes: Record<string, string>;
  content: string;
  children: XMLNode[];
  originalTagContent?: string; 
}


export class SlideParser {
  private buffer = "";
  private completedSections: string[] = [];
  private parsedSlides: PlateSlide[] = [];
  private lastInputLength = 0;

  
  private sectionIdMap = new Map<string, string>();
  private latestContent = "";

  
  public parseChunk(chunk: string): PlateSlide[] {
    
    if (chunk.length > 100) {
      console.log("=".repeat(80));
      console.log("PARSER - Processing XML chunk (length:", chunk.length, ")");
      console.log("First 500 chars:", chunk.substring(0, 500));
      console.log("Last 500 chars:", chunk.substring(Math.max(0, chunk.length - 500)));
      console.log("=".repeat(80));
    }

    
    this.latestContent = chunk;

    
    const isFullContent =
      chunk.length >= this.lastInputLength &&
      chunk.substring(0, this.lastInputLength) ===
        this.buffer.substring(0, this.lastInputLength);

    
    
    if (isFullContent && this.lastInputLength > 0) {
      
      this.buffer = this.buffer + chunk.substring(this.lastInputLength);
    } else {
      
      this.buffer = chunk;
    }

    
    this.lastInputLength = chunk.length;

    
    this.extractCompleteSections();

    
    const newSlides = this.processSections();

    return newSlides;
  }

  
  public finalize(): PlateSlide[] {
    try {
      console.log("=".repeat(80));
      console.log("PARSER - Finalizing, buffer length:", this.buffer.length);
      console.log("=".repeat(80));

      
      this.extractCompleteSections();

      
      let remainingBuffer = this.buffer.trim();

      
      if (remainingBuffer.startsWith("<PRESENTATION")) {
        const tagEndIdx = remainingBuffer.indexOf(">");
        if (tagEndIdx !== -1) {
          remainingBuffer = remainingBuffer.substring(tagEndIdx + 1).trim();
        }
      }

      if (remainingBuffer.startsWith("<SECTION")) {
        console.log("PARSER - Force closing incomplete section");
        
        const fixedSection = remainingBuffer + "</SECTION>";
        this.completedSections.push(fixedSection);
      }

      
      const finalSlides = this.processSections();

      
      this.latestContent = "";

      return finalSlides;
    } catch (e) {
      console.error("Error during finalization:", e);
      return [];
    }
  }

  
  public getAllSlides(): PlateSlide[] {
    return this.parsedSlides;
  }

  
  public reset(): void {
    this.buffer = "";
    this.completedSections = [];
    this.parsedSlides = [];
    this.lastInputLength = 0;
    this.latestContent = "";
    
  }

  
  public clearAllGeneratingMarks(): void {
    
    for (const slide of this.parsedSlides) {
      this.clearGeneratingMarksFromNodes(slide.content as Descendant[]);
    }

    
    this.latestContent = "";
  }

  
  private clearGeneratingMarksFromNodes(nodes: Descendant[]): void {
    for (const node of nodes) {
      if ("text" in node && (node as GeneratingText).generating !== undefined) {
        (node as GeneratingText).generating = undefined;
      }

      if (
        "children" in node &&
        Array.isArray(node.children) &&
        node.children.length > 0
      ) {
        this.clearGeneratingMarksFromNodes(node.children as Descendant[]);
      }
    }
  }

  
  private processSections(): PlateSlide[] {
    if (this.completedSections.length === 0) {
      return [];
    }

    const newSlides = this.completedSections.map(this.convertSectionToPlate);

    
    console.log("=".repeat(80));
    console.log("PARSER - Created", newSlides.length, "new slides:");
    newSlides.forEach((slide, index) => {
      const h1 = slide.content.find((node) => node.type === "h1");
      const h1Text = h1 ? (h1 as any).children?.[0]?.text || "(no text)" : "(no H1)";
      console.log(`  Slide ${index + 1}: H1 = "${h1Text}"`);
    });
    console.log("=".repeat(80));

    this.parsedSlides = [...this.parsedSlides, ...newSlides];
    this.completedSections = [];

    return newSlides;
  }

  
  private extractCompleteSections(): void {
    let startIdx = 0;
    let extractedSectionEndIdx = 0;

    
    const presentationStartIdx = this.buffer.indexOf("<PRESENTATION");
    if (presentationStartIdx !== -1 && presentationStartIdx < 10) {
      
      const tagEndIdx = this.buffer.indexOf(">", presentationStartIdx);
      if (tagEndIdx !== -1) {
        
        startIdx = tagEndIdx + 1;

        
        const commentStartIdx = this.buffer.indexOf("<!--", startIdx);
        if (commentStartIdx !== -1 && commentStartIdx < startIdx + 20) {
          const commentEndIdx = this.buffer.indexOf("-->", commentStartIdx);
          if (commentEndIdx !== -1) {
            startIdx = commentEndIdx + 3;
          }
        }
      }
    }

    while (true) {
      
      const sectionStartIdx = this.buffer.indexOf("<SECTION", startIdx);
      if (sectionStartIdx === -1) break;

      
      const sectionEndIdx = this.buffer.indexOf("</SECTION>", sectionStartIdx);
      const nextSectionIdx = this.buffer.indexOf(
        "<SECTION",
        sectionStartIdx + 1,
      );

      
      if (
        sectionEndIdx !== -1 &&
        (nextSectionIdx === -1 || sectionEndIdx < nextSectionIdx)
      ) {
        
        const completeSection = this.buffer.substring(
          sectionStartIdx,
          sectionEndIdx + "</SECTION>".length,
        );

        this.completedSections.push(completeSection);
        startIdx = sectionEndIdx + "</SECTION>".length;
        extractedSectionEndIdx = startIdx;
      }
      
      else if (nextSectionIdx !== -1) {
        
        const partialSection = this.buffer.substring(
          sectionStartIdx,
          nextSectionIdx,
        );

        
        if (
          partialSection.includes("<H1>") ||
          partialSection.includes("<H2>") ||
          partialSection.includes("<H3>") ||
          partialSection.includes("<PYRAMID>") ||
          partialSection.includes("<ARROWS>") ||
          partialSection.includes("<TIMELINE>") ||
          partialSection.includes("<P>") ||
          partialSection.includes("<ICON>") ||
          partialSection.includes("<IMG")
        ) {
          
          this.completedSections.push(partialSection + "</SECTION>");
        }

        startIdx = nextSectionIdx;
        extractedSectionEndIdx = nextSectionIdx;
      }
      
      else {
        
        break;
      }
    }

    
    if (extractedSectionEndIdx > 0) {
      this.buffer = this.buffer.substring(extractedSectionEndIdx);
    }
  }

  
  private generateSectionIdentifier(sectionNode: XMLNode): string {
    
    const h1Node = sectionNode.children.find(
      (child) => child.tag.toUpperCase() === "H1",
    );

    
    if (h1Node) {
      const headingContent = this.getTextContent(h1Node);
      if (headingContent.trim().length > 0) {
        return `heading-${headingContent.trim()}`;
      }
    }

    
    
    let fingerprint = "";

    
    const attrKeys = Object.keys(sectionNode.attributes).sort();
    if (attrKeys.length > 0) {
      fingerprint += attrKeys
        .map((key) => `${key}=${sectionNode.attributes[key]}`)
        .join(";");
    }

    
    const childTags = sectionNode.children
      .slice(0, 3)
      .map((child) => child.tag.toUpperCase());
    if (childTags.length > 0) {
      fingerprint += "|" + childTags.join("-");
    }

    
    
    if (fingerprint.length < 5) {
      
      let hash = 0;
      const fullContent = sectionNode.originalTagContent ?? "";
      for (let i = 0; i < fullContent.length; i++) {
        const char = fullContent.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; 
      }
      fingerprint = `content-hash-${Math.abs(hash)}`;
    }

    return fingerprint;
  }

  
  private convertSectionToPlate = (sectionString: string): PlateSlide => {
    
    const rootNode = this.parseXML(sectionString);

    
    const sectionNode = rootNode.children.find(
      (child) => child.tag.toUpperCase() === "SECTION",
    );

    if (!sectionNode) {
      return {
        id: nanoid(),
        content: [],
        layoutType: undefined,
        alignment: "center",
      }; 
    }

    
    const sectionIdentifier = this.generateSectionIdentifier(sectionNode);

    
    let slideId: string;
    if (this.sectionIdMap.has(sectionIdentifier)) {
      
      slideId = this.sectionIdMap.get(sectionIdentifier)!;
    } else {
      
      slideId = nanoid();
      
      this.sectionIdMap.set(sectionIdentifier, slideId);
    }

    
    let layoutType: LayoutType | undefined;
    const layoutAttr = sectionNode.attributes.layout;

    if (layoutAttr) {
      
      if (
        layoutAttr === "left" ||
        layoutAttr === "right" ||
        layoutAttr === "vertical" ||
        layoutAttr === "background"
      ) {
        layoutType = layoutAttr as LayoutType;
      } else {
        layoutType = "left";
      }
    }

    
    const plateElements: PlateNode[] = [];
    let rootImage:
      | { query: string; url?: string; layoutType?: LayoutType }
      | undefined;

    for (const child of sectionNode.children) {
      
      if (child.tag.toUpperCase() === "IMG") {
        
        if (child.originalTagContent) {
          const url = child.attributes.url ?? child.attributes.src ?? "";

          
          const queryStart = child.originalTagContent.indexOf("query=");
          let isCompleteQuery = false;

          if (queryStart !== -1) {
            const afterQuery = child.originalTagContent.substring(
              queryStart + 6,
            );
            if (afterQuery.length > 0) {
              const quoteChar = afterQuery[0];
              if (quoteChar === '"' || quoteChar === "'") {
                
                const closingQuoteIdx = afterQuery.indexOf(quoteChar, 1);

                
                isCompleteQuery = closingQuoteIdx !== -1;

                
                if (isCompleteQuery) {
                  const extractedQuery = afterQuery.substring(
                    1,
                    closingQuoteIdx,
                  );

                  
                  if (
                    extractedQuery &&
                    extractedQuery.trim().length > 0 &&
                    !rootImage
                  ) {
                    rootImage = {
                      query: extractedQuery,
                      layoutType,
                      ...(url ? { url } : {}),
                    };
                  }
                }
              }
            }
          }
        }
        
        continue;
      }

      
      if (child.tag.toUpperCase() === "DIV") {
        
        for (const divChild of child.children) {
          const processedElement = this.processTopLevelNode(divChild);
          if (processedElement) {
            plateElements.push(processedElement);
          }
        }
      } else {
        
        const processedElement = this.processTopLevelNode(child);
        if (processedElement) {
          plateElements.push(processedElement);
        }
      }
    }

    if (rootImage) {
      rootImage = { ...rootImage, layoutType: "background" };
      layoutType = "background";
    }

    
    return {
      id: slideId, 
      content: plateElements,
      ...(rootImage ? { rootImage } : {}),
      ...(layoutType ? { layoutType } : {}),
      alignment: "center",
    };
  };

  
  private processTopLevelNode(node: XMLNode): PlateNode | null {
    const tag = node.tag.toUpperCase();

    
    switch (tag) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        return this.createHeading(
          tag.toLowerCase() as "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
          node,
        );

      case "P":
        return this.createParagraph(node);

      case "IMG":
        return this.createImage(node);

      case "COLUMNS":
        return this.createColumns(node);

      case "BULLETS":
        return this.createBulletGroup(node);

      case "ICONS":
        return this.createIconList(node);

      case "CYCLE":
        return this.createCycle(node);

      case "STAIRCASE":
        return this.createStaircase(node);

      case "CHART":
        return this.createChart(node);

      case "ARROWS":
        return this.createArrowList(node);

      
      case "BOXES":
        return this.createBoxes(node);
      case "COMPARE":
        return this.createCompare(node);
      case "BEFORE-AFTER":
      case "BEFOREAFTER":
        return this.createBeforeAfter(node);
      case "PROS-CONS":
      case "PROSCONS":
        return this.createProsCons(node);
      case "ARROW-VERTICAL":
      case "ARROW_VERTICAL":
      case "VERTICAL-ARROWS":
      case "VERTICAL_ARROWS":
        return this.createArrowVertical(node);
      case "TABLE":
        return this.createPlainTable(node);

      case "BUTTON":
        return this.createButton(node);

      case "PYRAMID":
        return this.createPyramid(node);

      case "TIMELINE":
        return this.createTimeline(node);

      default:
        console.warn(`Unknown top-level tag: ${tag}`);
        return null;
    }
  }

  
  private parseXML(xmlString: string): XMLNode {
    
    const rootNode: XMLNode = {
      tag: "ROOT",
      attributes: {},
      content: "",
      children: [],
    };

    
    let processedXml = xmlString;

    
    const presentationOpenStart = processedXml.indexOf("<PRESENTATION");
    if (presentationOpenStart !== -1) {
      const presentationOpenEnd = processedXml.indexOf(
        ">",
        presentationOpenStart,
      );
      if (presentationOpenEnd !== -1) {
        
        processedXml =
          processedXml.substring(0, presentationOpenStart) +
          processedXml.substring(presentationOpenEnd + 1);
      }
    }

    
    processedXml = processedXml.replace("</PRESENTATION>", "");

    try {
      
      let fixedXml = processedXml;

      
      if (fixedXml.includes("<SECTION") && !fixedXml.endsWith("</SECTION>")) {
        fixedXml += "</SECTION>";
      }

      
      this.parseElement(fixedXml, rootNode);
    } catch (error) {
      console.error("Error parsing XML:", error);

      
      
      let withoutPresentation = xmlString;

      
      const presentationOpenStart =
        withoutPresentation.indexOf("<PRESENTATION");
      if (presentationOpenStart !== -1) {
        const presentationOpenEnd = withoutPresentation.indexOf(
          ">",
          presentationOpenStart,
        );
        if (presentationOpenEnd !== -1) {
          
          withoutPresentation =
            withoutPresentation.substring(0, presentationOpenStart) +
            withoutPresentation.substring(presentationOpenEnd + 1);
        }
      }

      
      withoutPresentation = withoutPresentation.replace("</PRESENTATION>", "");

      const sections = withoutPresentation.split(/<\/?SECTION[^>]*>/);
      let inSection = false;

      for (const section of sections) {
        if (inSection && section.trim()) {
          
          const sectionNode: XMLNode = {
            tag: "SECTION",
            attributes: {},
            content: "",
            children: [],
          };

          
          sectionNode.content = section.trim();
          rootNode.children.push(sectionNode);
        }
        inSection = !inSection;
      }
    }

    return rootNode;
  }

  
  private parseElement(xml: string, parentNode: XMLNode): void {
    let currentIndex = 0;

    while (currentIndex < xml.length) {
      
      const tagStart = xml.indexOf("<", currentIndex);

      
      if (tagStart === -1) {
        parentNode.content += xml.substring(currentIndex);
        break;
      }

      
      if (tagStart > currentIndex) {
        parentNode.content += xml.substring(currentIndex, tagStart);
      }

      
      const tagEnd = xml.indexOf(">", tagStart);

      
      if (tagEnd === -1) {
        parentNode.content += xml.substring(tagStart);
        break;
      }

      
      const tagContent = xml.substring(tagStart + 1, tagEnd);

      
      if (tagContent.startsWith("/")) {
        const closingTag = tagContent.substring(1);

        if (closingTag.toUpperCase() === parentNode.tag.toUpperCase()) {
          
          currentIndex = tagEnd + 1;
          break;
        } else {
          
          currentIndex = tagEnd + 1;
          continue;
        }
      }

      
      if (tagContent.startsWith("!--")) {
        const commentEnd = xml.indexOf("-->", tagStart);
        currentIndex = commentEnd !== -1 ? commentEnd + 3 : xml.length;
        continue;
      }

      
      let tagName: string;
      let attrString: string;

      const firstSpace = tagContent.indexOf(" ");
      if (firstSpace === -1) {
        tagName = tagContent;
        attrString = "";
      } else {
        tagName = tagContent.substring(0, firstSpace);
        attrString = tagContent.substring(firstSpace + 1);
      }

      
      if (tagName.startsWith("!") || tagName.startsWith("?")) {
        currentIndex = tagEnd + 1;
        continue;
      }

      
      const isSelfClosing = tagContent.endsWith("/");
      if (isSelfClosing) {
        tagName = tagName.replace(/\/$/, "");
      }

      
      const attributes: Record<string, string> = {};
      let attrRemaining = attrString.trim();

      while (attrRemaining.length > 0) {
        
        const eqIndex = attrRemaining.indexOf("=");
        if (eqIndex === -1) {
          
          break;
        }

        const attrName = attrRemaining.substring(0, eqIndex).trim();
        attrRemaining = attrRemaining.substring(eqIndex + 1).trim();

        
        let attrValue = "";
        const quoteChar = attrRemaining.charAt(0);

        if (quoteChar === '"' || quoteChar === "'") {
          
          const endQuoteIndex = attrRemaining.indexOf(quoteChar, 1);

          if (endQuoteIndex !== -1) {
            attrValue = attrRemaining.substring(1, endQuoteIndex);
            attrRemaining = attrRemaining.substring(endQuoteIndex + 1).trim();
          } else {
            
            attrValue = attrRemaining.substring(1);
            attrRemaining = "";
          }
        } else {
          
          const nextSpaceIndex = attrRemaining.indexOf(" ");

          if (nextSpaceIndex !== -1) {
            attrValue = attrRemaining.substring(0, nextSpaceIndex);
            attrRemaining = attrRemaining.substring(nextSpaceIndex + 1).trim();
          } else {
            attrValue = attrRemaining;
            attrRemaining = "";
          }
        }

        attributes[attrName] = attrValue;
      }

      
      const newNode: XMLNode = {
        tag: tagName,
        attributes,
        content: "",
        children: [],
        originalTagContent: xml.substring(tagStart, tagEnd + 1),
      };

      
      parentNode.children.push(newNode);

      
      currentIndex = tagEnd + 1;

      
      if (!isSelfClosing) {
        
        this.parseElement(xml.substring(currentIndex), newNode);

        
        const closingTag = `</${tagName}>`;
        const closingTagIndex = xml.indexOf(closingTag, currentIndex);

        if (closingTagIndex !== -1) {
          currentIndex = closingTagIndex + closingTag.length;
        } else {
          
          
          break;
        }
      }
    }
  }

  
  private shouldHaveGeneratingMark(text: string): boolean {
    
    const trimmedText = text.trim();
    if (!trimmedText) return false;

    
    const textPos = this.latestContent.lastIndexOf(trimmedText);
    if (textPos === -1) return false;

    
    const textEnd = textPos + trimmedText.length;
    if (textEnd >= this.latestContent.length) return true;

    
    const afterText = this.latestContent.substring(textEnd).trim();
    return !afterText.startsWith("<");
  }

  
  private createHeading(
    level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
    node: XMLNode,
  ): HeadingElement {
    return {
      type: level,
      children: this.getTexDescendants(node),
    } as HeadingElement;
  }

  
  private createParagraph(node: XMLNode): ParagraphElement {
    return {
      type: "p",
      children: this.getTexDescendants(node),
    } as ParagraphElement;
  }

  
  private createImage(node: XMLNode): ImageElement | null {
    
    if (!node.originalTagContent) {
      return null;
    }

    const url = node.attributes.url ?? node.attributes.src ?? "";

    
    const queryStart = node.originalTagContent.indexOf("query=");

    if (queryStart === -1) {
      return null;
    }

    const afterQuery = node.originalTagContent.substring(queryStart + 6);
    if (afterQuery.length === 0) {
      return null;
    }

    const quoteChar = afterQuery[0];
    if (quoteChar !== '"' && quoteChar !== "'") {
      return null;
    }

    
    const closingQuoteIdx = afterQuery.indexOf(quoteChar, 1);

    
    if (closingQuoteIdx === -1) {
      return null;
    }

    
    const query = afterQuery.substring(1, closingQuoteIdx);

    
    if (!query || query.trim().length < 3) {
      return null;
    }

    
    return {
      type: "img",
      url: url,
      query: query,
      children: [{ text: "" } as TText],
    } as ImageElement;
  }

  
  private createColumns(node: XMLNode): TColumnGroupElement {
    const columnItems: TColumnElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        const columnItem: TColumnElement = {
          type: ColumnItemPlugin.key,
          children: this.processNodes(child.children) as Descendant[],
          width: "M",
        };
        columnItems.push(columnItem);
      }
    }

    return {
      type: ColumnPlugin.key,
      children: columnItems,
    } as TColumnGroupElement;
  }

  
  private processDiv(node: XMLNode): PlateNode | null {
    
    const children = this.processNodes(node.children);

    const nodeContent = node.content.trim();

    if (children.length === 0) {
      
      return {
        type: "p",
        children: [
          {
            text: nodeContent,
            
            ...(this.shouldHaveGeneratingMark(nodeContent)
              ? { generating: true }
              : {}),
          } as TText,
        ],
      } as ParagraphElement;
    } else if (children.length === 1) {
      
      return children[0] ?? null;
    } else {
      
      return {
        type: "p",
        children: children as Descendant[],
      } as ParagraphElement;
    }
  }

  
  private createBulletGroup(node: XMLNode): TBulletGroupElement {
    const bulletItems: TBulletItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        const bulletItem: TBulletItemElement = {
          type: "bullet",
          children: this.processNodes(child.children) as Descendant[],
        };
        bulletItems.push(bulletItem);
      }
    }

    return {
      type: "bullets",
      children: bulletItems,
    } as TBulletGroupElement;
  }

  
  private createIconList(node: XMLNode): TIconListElement {
    const iconItems: TIconListItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        
        let query = "";
        const children: Descendant[] = [];

        for (const iconChild of child.children) {
          if (iconChild.tag.toUpperCase() === "ICON") {
            
            let rawQuery = iconChild.attributes.query ?? "";

            
            if (
              rawQuery.includes("<") ||
              rawQuery.includes(">") ||
              rawQuery.includes("</") ||
              rawQuery.includes("SECTION")
            ) {
              const tagIndex = Math.min(
                rawQuery.indexOf("<") !== -1 ? rawQuery.indexOf("<") : Infinity,
                rawQuery.indexOf(">") !== -1 ? rawQuery.indexOf(">") : Infinity,
                rawQuery.indexOf("</") !== -1
                  ? rawQuery.indexOf("</")
                  : Infinity,
                rawQuery.indexOf("SECTION") !== -1
                  ? rawQuery.indexOf("SECTION")
                  : Infinity,
              );

              rawQuery = rawQuery.substring(0, tagIndex).trim();
            }

            
            if (rawQuery && rawQuery.trim().length >= 2) {
              query = rawQuery.trim();
            }
          } else {
            const processedChild = this.processNode(iconChild);
            if (processedChild) {
              children.push(processedChild as Descendant);
            }
          }
        }

        
        if (query) {
          children.unshift({
            type: "icon",
            query: query,
            children: [{ text: "" } as TText],
          } as TIconElement);
        }

        const iconItem: TIconListItemElement = {
          type: "icon-item",
          children,
        };
        iconItems.push(iconItem);
      }
    }

    return {
      type: "icons",
      children: iconItems,
    } as TIconListElement;
  }

  
  private createCycle(node: XMLNode): TCycleGroupElement {
    const cycleItems: TCycleItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        const cycleItem: TCycleItemElement = {
          type: "cycle-item",
          children: this.processNodes(child.children) as Descendant[],
        };
        cycleItems.push(cycleItem);
      }
    }

    return {
      type: "cycle",
      children: cycleItems,
    } as TCycleGroupElement;
  }

  
  private createStaircase(node: XMLNode): TStairGroupElement {
    const stairItems: TStairItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        const stairItem: TStairItemElement = {
          type: "stair-item",
          children: this.processNodes(child.children) as Descendant[],
        };
        stairItems.push(stairItem);
      }
    }

    return {
      type: "staircase",
      children: stairItems,
    } as TStairGroupElement;
  }

  
  private createArrowList(node: XMLNode): TArrowListElement {
    const arrowItems: TArrowListItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        
        const itemChildren: Descendant[] = [];

        for (const divChild of child.children) {
          const processedChild = this.processNode(divChild);
          if (processedChild) {
            itemChildren.push(processedChild as Descendant);
          }
        }

        
        if (itemChildren.length === 0 && child.content.trim()) {
          const contentText = child.content.trim();
          itemChildren.push({
            text: contentText,
            
            ...(this.shouldHaveGeneratingMark(contentText)
              ? { generating: true }
              : {}),
          } as TText);
        }

        
        if (itemChildren.length > 0) {
          arrowItems.push({
            type: "arrow-item",
            children: itemChildren,
          } as TArrowListItemElement);
        }
      }
    }

    return {
      type: "arrows",
      children:
        arrowItems.length > 0
          ? arrowItems
          : ([{ text: "" } as TText] as Descendant[]),
    } as TArrowListElement;
  }

  
  private createPyramid(node: XMLNode): TPyramidGroupElement {
    const pyramidItems: TPyramidItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        const pyramidItem: TPyramidItemElement = {
          type: "pyramid-item",
          children: this.processNodes(child.children) as Descendant[],
        };
        pyramidItems.push(pyramidItem);
      }
    }

    return {
      type: "pyramid",
      children: pyramidItems,
    } as TPyramidGroupElement;
  }

  
  private createBoxes(node: XMLNode): TBoxGroupElement {
    const items: TBoxItemElement[] = [];
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        items.push({
          type: "box-item",
          children: this.processNodes(child.children) as Descendant[],
        } as TBoxItemElement);
      }
    }
    return { type: "boxes", children: items } as TBoxGroupElement;
  }

  
  private createCompare(node: XMLNode): TCompareGroupElement {
    const sides: TCompareSideElement[] = [];
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        sides.push({
          type: "compare-side",
          children: this.processNodes(child.children) as Descendant[],
        } as TCompareSideElement);
      }
    }
    return { type: "compare", children: sides } as TCompareGroupElement;
  }

  
  private createBeforeAfter(node: XMLNode): TBeforeAfterGroupElement {
    const sides: TBeforeAfterSideElement[] = [];
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        sides.push({
          type: "before-after-side",
          children: this.processNodes(child.children) as Descendant[],
        } as TBeforeAfterSideElement);
      }
    }
    return {
      type: "before-after",
      children: sides,
    } as TBeforeAfterGroupElement;
  }

  
  private createProsCons(node: XMLNode): TProsConsGroupElement {
    const children: (TProsItemElement | TConsItemElement)[] = [];
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "PROS") {
        children.push({
          type: "pros-item",
          children: this.processNodes(child.children) as Descendant[],
        } as TProsItemElement);
      } else if (child.tag.toUpperCase() === "CONS") {
        children.push({
          type: "cons-item",
          children: this.processNodes(child.children) as Descendant[],
        } as TConsItemElement);
      } else if (child.tag.toUpperCase() === "DIV") {
        
        const isPros = children.length % 2 === 0;
        children.push({
          type: isPros ? "pros-item" : "cons-item",
          children: this.processNodes(child.children) as Descendant[],
        } as unknown as TProsItemElement);
      }
    }
    return { type: "pros-cons", children } as TProsConsGroupElement;
  }

  
  private createArrowVertical(node: XMLNode): TSequenceArrowGroupElement {
    const items: TSequenceArrowItemElement[] = [];
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        items.push({
          type: "arrow-vertical-item",
          children: this.processNodes(child.children) as Descendant[],
        } as TSequenceArrowItemElement);
      }
    }
    return {
      type: "arrow-vertical",
      children: items,
    } as TSequenceArrowGroupElement;
  }

  
  private createPlainTable(node: XMLNode): TTableElement {
    const rows: TTableRowElement[] = [];

    const parseRow = (rowNode: XMLNode): void => {
      if (!rowNode) return;
      const cells: TTableCellElement[] = [];

      for (const cellNode of rowNode.children) {
        const tag = cellNode.tag.toUpperCase();
        if (tag === "TD" || tag === "TH") {
          const isCellHeader = tag === "TH";

          const cellChildren = this.processNodes(
            cellNode.children,
          ) as Descendant[];

          const colSpanStr =
            cellNode.attributes.colspan || cellNode.attributes.colSpan;
          const rowSpanStr =
            cellNode.attributes.rowspan || cellNode.attributes.rowSpan;

          const colSpanVal = colSpanStr ? parseInt(colSpanStr, 10) : undefined;
          const rowSpanVal = rowSpanStr ? parseInt(rowSpanStr, 10) : undefined;

          const background =
            cellNode.attributes.background || cellNode.attributes.bg;

          const extraProps: {
            colSpan?: number;
            rowSpan?: number;
            background?: string;
          } = {};
          if (colSpanVal && colSpanVal > 1) extraProps.colSpan = colSpanVal;
          if (rowSpanVal && rowSpanVal > 1) extraProps.rowSpan = rowSpanVal;
          if (background) extraProps.background = background;

          const cell = {
            type: isCellHeader ? "th" : "td",
            ...extraProps,
            children:
              cellChildren.length > 0
                ? cellChildren
                : ([
                    {
                      type: "p",
                      children: [
                        { text: cellNode.content?.trim?.() || "" } as TText,
                      ],
                    },
                  ] as unknown as Descendant[]),
          } as unknown as TTableCellElement;

          cells.push(cell);
        }
      }

      rows.push({ type: "tr", children: cells } as TTableRowElement);
    };

    
    for (const child of node.children) {
      const tag = child.tag.toUpperCase();
      if (tag === "THEAD") {
        for (const row of child.children) {
          const rowTag = row.tag.toUpperCase();
          if (rowTag === "TR" || rowTag === "ROW") parseRow(row);
        }
      }
    }

    
    const directRows: XMLNode[] = [];
    const bodyRows: XMLNode[] = [];
    for (const child of node.children) {
      const tag = child.tag.toUpperCase();
      if (tag === "TBODY") {
        for (const row of child.children) {
          const rowTag = row.tag.toUpperCase();
          if (rowTag === "TR" || rowTag === "ROW") bodyRows.push(row);
        }
      } else if (tag === "TR" || tag === "ROW") {
        directRows.push(child);
      }
    }

    const remainingRows: XMLNode[] = [...directRows, ...bodyRows];

    for (let i = 0; i < remainingRows.length; i++) {
      const row = remainingRows[i]!;
      parseRow(row);
    }

    return { type: "table", children: rows } as TTableElement;
  }
  
  private createTimeline(node: XMLNode): TTimelineGroupElement {
    const timelineItems: TTimelineItemElement[] = [];

    
    for (const child of node.children) {
      if (child.tag.toUpperCase() === "DIV") {
        
        const itemChildren: Descendant[] = [];

        for (const divChild of child.children) {
          const processedChild = this.processNode(divChild);
          if (processedChild) {
            itemChildren.push(processedChild as Descendant);
          }
        }

        
        if (itemChildren.length === 0 && child.content.trim()) {
          const contentText = child.content.trim();
          itemChildren.push({
            text: contentText,
            
            ...(this.shouldHaveGeneratingMark(contentText)
              ? { generating: true }
              : {}),
          } as TText);
        }

        
        if (itemChildren.length > 0) {
          timelineItems.push({
            type: "timeline-item",
            children: itemChildren,
          } as TTimelineItemElement);
        }
      }
    }

    return {
      type: "timeline",
      children:
        timelineItems.length > 0
          ? timelineItems
          : ([{ text: "" } as TText] as Descendant[]),
    } as TTimelineGroupElement;
  }

  
  private createChart(node: XMLNode): PlateNode {
    
    const chartType = (node.attributes.charttype || "bar").toLowerCase();

    
    const dataNodes = node.children.filter(
      (child) => child.tag.toUpperCase() === "DATA",
    );

    let parsedData: unknown[] | null = null;

    if (dataNodes.length > 0) {
      if (chartType === "scatter") {
        const points: Array<{ x: number; y: number }> = [];
        for (const d of dataNodes) {
          
          const xNode = d.children.find((c) => c.tag.toUpperCase() === "X");
          const yNode = d.children.find((c) => c.tag.toUpperCase() === "Y");
          const xAttr = d.attributes.x;
          const yAttr = d.attributes.y;
          const x = parseFloat(xNode?.content?.trim?.() || xAttr || "0");
          const y = parseFloat(yNode?.content?.trim?.() || yAttr || "0");
          points.push({
            x: Number.isNaN(x) ? 0 : x,
            y: Number.isNaN(y) ? 0 : y,
          });
        }
        parsedData = points;
      } else {
        const rows: Array<{ label: string; value: number }> = [];
        for (const d of dataNodes) {
          
          const labelNode = d.children.find(
            (c) => c.tag.toUpperCase() === "LABEL",
          );
          const valueNode = d.children.find(
            (c) => c.tag.toUpperCase() === "VALUE",
          );
          const labelAttr = d.attributes.label ?? d.attributes.name ?? "";
          const valueAttr = d.attributes.value ?? "";
          const label = (
            labelNode?.content?.trim?.() ||
            labelAttr ||
            ""
          ).toString();
          const valueParsed = parseFloat(
            (valueNode?.content?.trim?.() || valueAttr || "0").toString(),
          );
          rows.push({
            label,
            value: Number.isNaN(valueParsed) ? 0 : valueParsed,
          });
        }
        parsedData = rows;
      }
    }

    
    if (parsedData === null) parsedData = [];

    const typeMap: Record<string, string> = {
      pie: PIE_CHART_ELEMENT,
      bar: BAR_CHART_ELEMENT,
      area: AREA_CHART_ELEMENT,
      radar: RADAR_CHART_ELEMENT,
      scatter: SCATTER_CHART_ELEMENT,
      line: LINE_CHART_ELEMENT,
    };

    const elementType = typeMap[chartType] || BAR_CHART_ELEMENT;

    
    return {
      type: elementType,
      data: parsedData,
      children: [{ text: "" } as TText],
    } as PlateNode;
  }

  
  private createButton(node: XMLNode): PlateNode {
    const variantAttr = (node.attributes.variant || "").toLowerCase();
    const sizeAttr = (node.attributes.size || "").toLowerCase();

    const variant: "filled" | "outline" | "ghost" | undefined =
      variantAttr === "filled" ||
      variantAttr === "outline" ||
      variantAttr === "ghost"
        ? (variantAttr as "filled" | "outline" | "ghost")
        : undefined;

    const size: "sm" | "md" | "lg" | undefined =
      sizeAttr === "sm" || sizeAttr === "md" || sizeAttr === "lg"
        ? (sizeAttr as "sm" | "md" | "lg")
        : undefined;

    const children = this.processNodes(node.children) as Descendant[];
    const fallback = node.content?.trim?.() || "";
    const finalChildren =
      children.length > 0
        ? children
        : ([{ text: fallback }] as unknown as Descendant[]);

    return {
      type: "button",
      ...(variant ? { variant } : {}),
      ...(size ? { size } : {}),
      children: finalChildren,
    } as unknown as PlateNode;
  }

  
  private getTexDescendants(node: XMLNode): Descendant[] {
    
    const descendants: Descendant[] = [];

    
    if (node.content) {
      
      const contentText = node.content;

      descendants.push({
        text: contentText,
        
        ...(this.shouldHaveGeneratingMark(contentText)
          ? { generating: true }
          : {}),
      } as GeneratingText);
    }

    
    for (const child of node.children) {
      const childTag = child.tag.toUpperCase();

      
      if (childTag === "B" || childTag === "STRONG") {
        const content = this.getTextContent(child, false);
        descendants.push({
          text: content, 
          bold: true,
          
          ...(this.shouldHaveGeneratingMark(content)
            ? { generating: true }
            : {}),
        } as Descendant);
      } else if (childTag === "I" || childTag === "EM") {
        const content = this.getTextContent(child, false);
        descendants.push({
          text: content, 
          italic: true,
          
          ...(this.shouldHaveGeneratingMark(content)
            ? { generating: true }
            : {}),
        } as Descendant);
      } else if (childTag === "U") {
        const content = this.getTextContent(child, false);
        descendants.push({
          text: content, 
          underline: true,
          
          ...(this.shouldHaveGeneratingMark(content)
            ? { generating: true }
            : {}),
        } as Descendant);
      } else if (childTag === "S" || childTag === "STRIKE") {
        const content = this.getTextContent(child, false);
        descendants.push({
          text: content, 
          strikethrough: true,
          
          ...(this.shouldHaveGeneratingMark(content)
            ? { generating: true }
            : {}),
        } as Descendant);
      }
      
      else {
        const processedChild = this.processNode(child);
        if (processedChild) {
          descendants.push(processedChild as Descendant);
        }
      }
    }

    
    const cleanedDescendants: Descendant[] = [];

    for (const descendant of descendants) {
      
      if ("text" in descendant && descendant.text === "") {
        continue;
      }

      
      cleanedDescendants.push(descendant);
    }

    
    return cleanedDescendants.length > 0
      ? cleanedDescendants
      : [{ text: "" } as TText];
  }

  
  private getTextContent(node: XMLNode, trim = true): string {
    
    let text = trim ? node.content.trim() : node.content;

    
    for (const child of node.children) {
      text += this.getTextContent(child, false); 
    }

    return text;
  }

  
  private processNodes(nodes: XMLNode[]): PlateNode[] {
    const plateNodes: PlateNode[] = [];

    
    for (let i = 0; i < nodes.length; ) {
      const node = nodes[i];
      if (!node) {
        i += 1;
        continue;
      }
      const tag = node.tag.toUpperCase();

      
      if (tag === "LI") {
        const liNodes: XMLNode[] = [];
        let j = i;
        while (j < nodes.length) {
          const candidate = nodes[j];
          if (!candidate) break;
          if (candidate.tag.toUpperCase() !== "LI") break;
          liNodes.push(candidate);
          j += 1;
        }
        const listItems = this.createListItemsFromLiNodes(liNodes);
        for (const item of listItems) plateNodes.push(item);
        i = j;
        continue;
      }

      
      const processedNode = this.processNode(node);
      if (processedNode) {
        plateNodes.push(processedNode);
      }
      i += 1;
    }

    return plateNodes;
  }

  
  private processNode(node: XMLNode): PlateNode | null {
    const tag = node.tag.toUpperCase();

    switch (tag) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        return this.createHeading(
          tag.toLowerCase() as "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
          node,
        );

      case "P":
        return this.createParagraph(node);

      case "IMG":
        
        return this.createImage(node);

      case "COLUMNS":
        return this.createColumns(node);

      case "DIV":
        
        return this.processDiv(node);

      case "BULLETS":
        return this.createBulletGroup(node);

      case "ICONS":
        return this.createIconList(node);

      case "CYCLE":
        return this.createCycle(node);

      case "STAIRCASE":
        return this.createStaircase(node);

      case "CHART":
        return this.createChart(node);

      case "ARROWS":
        return this.createArrowList(node);

      case "LI":
        
        return this.createListItemsFromLiNodes([node])[0] ?? null;

      case "PYRAMID":
        return this.createPyramid(node);

      case "TIMELINE":
        return this.createTimeline(node);

      case "ICON":
        
        
        return null;

      case "BUTTON":
        return this.createButton(node);

      default:
        
        if (node.children.length > 0) {
          const children = this.processNodes(node.children);
          
          
          if (children.length > 0) {
            return {
              type: "p",
              children: children as Descendant[],
            } as ParagraphElement;
          }
        }

        
        return null;
    }
  }

  
  private createListItemsFromLiNodes(
    liNodes: XMLNode[],
    isOrdered = false,
  ): ParagraphElement[] {
    const items: ParagraphElement[] = [];

    for (const li of liNodes) {
      
      let itemChildren = this.processNodes(li.children) as Descendant[];
      const contentText = li.content?.trim?.() ?? "";

      if ((!itemChildren || itemChildren.length === 0) && contentText) {
        itemChildren = [
          {
            text: contentText,
            ...(this.shouldHaveGeneratingMark(contentText)
              ? { generating: true }
              : {}),
          } as TText,
        ] as unknown as Descendant[];
      }

      if (!itemChildren || itemChildren.length === 0) {
        itemChildren = [{ text: "" } as TText] as unknown as Descendant[];
      }

      items.push({
        type: "p",
        children: itemChildren,
        indent: 1,
        listStyleType: isOrdered ? "decimal" : "disc",
      } as unknown as ParagraphElement);
    }

    return items;
  }
}


export function parseSlideXml(xmlData: string): PlateSlide[] {
  const parser = new SlideParser();
  parser.parseChunk(xmlData);
  parser.finalize();
  return parser.getAllSlides();
}

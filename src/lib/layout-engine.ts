import crypto from 'crypto';

export type SlideLayout = TextElement[];

export interface TextElement {
  id: number;
  role: 'title' | 'subtitle' | 'body_text' | 'list_item' | 'caption' | 'footer';
  text_content: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  font: {
    size: number;
    weight: 'normal' | 'bold';
  };
  group_id: string | null;
}

const Y_PROXIMITY_THRESHOLD = 80; // Max Y distance to be considered in the same group
const FONT_SIZE_TOLERANCE = 5; // Max font size delta to be in the same group

/**
 * Groups text elements into clusters based on proximity and font size.
 * @param elements The text elements to cluster.
 * @returns The text elements with group_id assigned.
 */
export function clusterTextElements(elements: SlideLayout): SlideLayout {
  const sortedElements = [...elements].sort(
    (a, b) => a.position.y - b.position.y,
  );

  const clusteredElements: SlideLayout = [];
  const visited = new Set<number>();

  for (const element of sortedElements) {
    if (visited.has(element.id) || element.role === 'title') {
      continue;
    }

    const group: SlideLayout = [];
    const groupId = crypto.randomUUID();

    for (const potentialNeighbor of sortedElements) {
      if (visited.has(potentialNeighbor.id)) {
        continue;
      }

      const yDistance = Math.abs(element.position.y - potentialNeighbor.position.y);
      const fontDifference = Math.abs(element.font.size - potentialNeighbor.font.size);

      // A simple clustering logic: check for vertical proximity and similar font size.
      // This could be enhanced with alignment checks (e.g., similar x-coordinates).
      if (
        yDistance < Y_PROXIMITY_THRESHOLD * 2 && // allow a wider range for finding candidates
        fontDifference <= FONT_SIZE_TOLERANCE &&
        potentialNeighbor.role !== 'title'
      ) {
        group.push(potentialNeighbor);
        visited.add(potentialNeighbor.id);
      }
    }

    if (group.length > 1) {
      for (const member of group) {
        clusteredElements.push({ ...member, group_id: groupId });
      }
    } else {
      // If a group has only one element, it's not really a group.
      // Add the original element back if it was pushed into a group of 1.
      visited.delete(element.id);
    }
  }

  // Add back any elements that were not part of a cluster (including titles)
  for (const element of sortedElements) {
    if (!visited.has(element.id)) {
      clusteredElements.push({ ...element, group_id: null });
    }
  }

  // Restore original order by id
  return clusteredElements.sort((a, b) => a.id - b.id);
}


/**
 * PHASE 1: Analyzes a slide image and extracts the text layout.
 * This is a placeholder implementation. In a real scenario, this function
 * would make an API call to a multimodal vision model (e.g., GPT-4o).
 *
 * @param _templateImage - The image data or URL of the slide to analyze.
 * @returns A promise that resolves to the structured layout of the slide.
 */
export async function analyzeSlideLayout(
  _templateImage: string,
): Promise<SlideLayout> {
  console.log('--- PHASE 1: ANALYZE SLIDE LAYOUT (CLUSTERED) ---');
  // This is a hardcoded example based on a hypothetical recipe slide.
  // In a real implementation, this would come from a vision model.
  const rawLayoutFromVisionModel: SlideLayout = [
    {
      id: 1,
      role: 'title',
      text_content: 'Apfelkuchen Rezept',
      position: { x: 100, y: 80 },
      size: { width: 800, height: 120 },
      font: { size: 96, weight: 'bold' },
      group_id: null,
    },
    {
      id: 2,
      role: 'list_item',
      text_content: '- 200g Mehl',
      position: { x: 120, y: 250 },
      size: { width: 400, height: 50 },
      font: { size: 42, weight: 'normal' },
      group_id: null, // Start with null, clustering will fill this
    },
    {
      id: 3,
      role: 'list_item',
      text_content: '- 100g Zucker',
      position: { x: 120, y: 310 },
      size: { width: 400, height: 50 },
      font: { size: 42, weight: 'normal' },
      group_id: null, // Start with null, clustering will fill this
    },
    {
      id: 4,
      role: 'list_item',
      text_content: '- 4 Äpfel',
      position: { x: 120, y: 370 },
      size: { width: 400, height: 50 },
      font: { size: 42, weight: 'normal' },
      group_id: null, // Start with null, clustering will fill this
    },
  ];

  const clusteredLayout = clusterTextElements(rawLayoutFromVisionModel);
  console.log("Clustered Layout:", clusteredLayout);
  return Promise.resolve(clusteredLayout);
}

/**
 * PHASE 2: Generates new text content for a given slide layout and topic.
 * This function now builds a structured prompt based on the clustered layout
 * and parses a simulated structured response.
 *
 * @param layout - The structured, clustered layout from Phase 1.
 * @param topic - The topic for the new content.
 * @param variety - The desired style of the content.
 * @returns A promise that resolves to the layout filled with new content.
 */
export async function generateSlideContent(
  layout: SlideLayout,
  topic: string,
  variety: string,
): Promise<SlideLayout> {
  console.log(
    `--- PHASE 2: GENERATE SLIDE CONTENT for topic: "${topic}" with variety: "${variety}" ---`,
  );

  // Step 1: Group elements by group_id
  const groups = new Map<string, SlideLayout>();
  const singles: SlideLayout = [];

  for (const element of layout) {
    if (element.group_id) {
      if (!groups.has(element.group_id)) {
        groups.set(element.group_id, []);
      }
      groups.get(element.group_id)!.push(element);
    } else {
      singles.push(element);
    }
  }

  // Step 2: Build the structured prompt (for a real LLM call)
  let prompt = `Generate content for a slide about "${topic}". The style should be "${variety}".\nThe slide has the following structure. Please provide content for each item in the specified format:\n\n`;
  
  let responseMap: { id: number; text: string }[] = [];
  let responseCounter = 1;

  for (const element of singles) {
    prompt += `  - A single element with role "${element.role}".\n`;
    responseMap.push({id: element.id, text: `Generated ${element.role} for ${topic}`});
  }

  for (const [groupId, groupElements] of groups.entries()) {
    prompt += `  - A group of ${groupElements.length} related items with role "${groupElements[0].role}".\n`;
    for (const element of groupElements) {
       responseMap.push({id: element.id, text: `Generated item ${responseCounter++} for group`});
    }
  }
  
  console.log("--- GENERATED PROMPT ---\n", prompt);

  // Step 3: Simulate a structured LLM response based on the prompt.
  // In a real scenario, you would make an API call with the prompt and get this back.
  const simulatedLLMResponse = {
    content: responseMap
  };
  console.log("--- SIMULATED LLM RESPONSE ---\n", simulatedLLMResponse);


  // Step 4: Parse the structured response and update the layout
  const newLayout = [...layout];
  const contentMap = new Map(simulatedLLMResponse.content.map(item => [item.id, item.text]));

  for (const element of newLayout) {
    if (contentMap.has(element.id)) {
      element.text_content = contentMap.get(element.id)!;
    }
  }

  return Promise.resolve(newLayout);
}

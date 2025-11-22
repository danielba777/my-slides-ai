'use server';

import {
  analyzeSlideLayout,
  generateSlideContent,
} from '@/lib/layout-engine';

/**
 * Server Action to generate slide content based on a visual template layout.
 *
 * @param templateImage - The image data or URL of the slide template.
 * @param topic - The topic for the new slide content.
 * @param variety - The desired style variation for the content.
 * @returns A promise that resolves to the final slide layout with generated text.
 */
export async function generateLayoutAwareSlide(
  templateImage: string,
  topic: string,
  variety: string,
) {
  try {
    // Phase 1: Analyze the visual layout of the template image
    const layout = await analyzeSlideLayout(templateImage);

    // Phase 2: Generate new text content based on the extracted layout
    const finalLayout = await generateSlideContent(layout, topic, variety);

    console.log('--- ACTION SUCCESS: Final Layout ---');
    console.log(JSON.stringify(finalLayout, null, 2));

    return {
      success: true,
      data: finalLayout,
    };
  } catch (error) {
    console.error('Error in generateLayoutAwareSlide action:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

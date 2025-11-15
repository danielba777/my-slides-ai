import { auth } from "@/server/auth";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

interface Slide {
  id: string;
  imageUrl: string;
  slideIndex?: number;
}

interface GenerateFromTemplateRequest {
  title: string;
  slides: Slide[];
  language: string;
  tone?: string;
}

const xmlGenerationTemplate = `You are an expert presentation writer. Your task is to recreate the text content from the analyzed slideshow images as accurately as possible in XML format.

## PRESENTATION DETAILS
- Title: {TITLE}
- Language: {LANGUAGE}
- Tone: {TONE}
- Total Slides: {TOTAL_SLIDES}
- Current Date: {CURRENT_DATE}

## SLIDE TEXT ANALYSIS
Based on the images you analyzed, the slides contain the following text:
{SLIDE_TEXT_CONTENT}

## YOUR TASK
Recreate the presentation in XML format, matching the text content from the images as closely as possible.

## OUTPUT TEMPLATE
\`\`\`xml
<PRESENTATION>
  <SECTION>
    <H1>Slide Title</H1>
    <P>Main text content from the slide.</P>
    <P>Additional paragraph if needed for multi-paragraph content.</P>
  </SECTION>

  <!-- Additional SECTION blocks, one per slide -->
</PRESENTATION>
\`\`\`

## FORMATTING GUIDELINES
1. Each slide becomes one <SECTION> block
2. The main heading/title goes in <H1>
3. Body text goes in <P> paragraphs
4. If the slide has bullet points or numbered items, preserve them in the paragraph text
5. Keep line breaks and formatting as close to the original as possible
6. Do NOT invent new content - only recreate what you see in the images
7. Preserve the exact wording and phrasing from the slides
8. Maintain the same tone, style, and voice as the original

## CRITICAL RULES
1. Generate exactly {TOTAL_SLIDES} slides. Not more, not less.
2. Match the text content from the analyzed images as accurately as possible
3. Use only the XML tags shown above: PRESENTATION, SECTION, H1, P
4. Do not add images, layout components, or any other tags
5. Keep the language and tone consistent with the original slides

Now create a complete XML presentation with {TOTAL_SLIDES} slides that accurately recreates the text content from the analyzed images.
`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slides, language, tone = "professional" } =
      (await req.json()) as GenerateFromTemplateRequest;

    if (!title || !slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Sort slides by index
    const sortedSlides = [...slides].sort(
      (a, b) => (a.slideIndex ?? 0) - (b.slideIndex ?? 0),
    );

    const imageUrls = sortedSlides
      .filter((slide) => slide.imageUrl)
      .map((slide) => slide.imageUrl);

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid images found in slides" },
        { status: 400 },
      );
    }

    // Step 1: Use OpenAI Vision API to extract text from all slides
    const visionContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: string } }
    > = [
      {
        type: "text",
        text: `Analyze these ${imageUrls.length} slideshow images and extract ALL visible text from each slide. For each slide, identify:

1. The main title/heading (if present)
2. All body text, bullet points, numbered items, or other content
3. Any captions or secondary text

Output the text for each slide in this format:

SLIDE 1:
[Title or main heading]
[Body text - preserve line breaks, bullets, and formatting]

SLIDE 2:
[Title or main heading]
[Body text - preserve line breaks, bullets, and formatting]

Continue for all ${imageUrls.length} slides. Extract the text EXACTLY as it appears - do not summarize, rephrase, or add content.`,
      },
    ];

    // Add all slide images
    for (const url of imageUrls) {
      visionContent.push({
        type: "image_url",
        image_url: {
          url: url,
          detail: "high",
        },
      });
    }

    // Call OpenAI Vision API to extract text
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API not configured" },
        { status: 500 },
      );
    }

    const visionResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: visionContent,
            },
          ],
          max_tokens: 2000,
        }),
      },
    );

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json().catch(() => null);
      console.error("OpenAI Vision API error:", errorData);
      return NextResponse.json(
        { error: "Failed to extract text from slides" },
        { status: visionResponse.status },
      );
    }

    const visionData = (await visionResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const extractedText = visionData.choices?.[0]?.message?.content?.trim();

    if (!extractedText) {
      return NextResponse.json(
        { error: "No text extracted from slides" },
        { status: 500 },
      );
    }

    // Step 2: Use the extracted text to generate XML presentation
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedPrompt = xmlGenerationTemplate
      .replace(/{TITLE}/g, title)
      .replace(/{LANGUAGE}/g, language)
      .replace(/{TONE}/g, tone)
      .replace(/{TOTAL_SLIDES}/g, imageUrls.length.toString())
      .replace(/{CURRENT_DATE}/g, currentDate)
      .replace(/{SLIDE_TEXT_CONTENT}/g, extractedText);

    const model = openai("gpt-4o");

    const result = streamText({
      model,
      prompt: formattedPrompt,
      temperature: 0.5,
    });

    // Use toTextStreamResponse instead of toDataStreamResponse to return plain text
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in template-based presentation generation:", error);
    return NextResponse.json(
      { error: "Failed to generate presentation from template" },
      { status: 500 },
    );
  }
}

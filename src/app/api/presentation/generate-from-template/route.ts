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
  variety?: number; // 0-100: how much content should differ from template
}

const xmlGenerationTemplate = `You are an expert at creating TikTok slideshows based on templates.

## SLIDESHOW DETAILS
- Total Slides: {TOTAL_SLIDES}
- Language: {LANGUAGE}
- Current Date: {CURRENT_DATE}
- Variety Level: {VARIETY}% (0% = exact copy, 100% = completely different content)

## EXTRACTED TEXT FROM SLIDES
{SLIDE_TEXT_CONTENT}

## YOUR TASK
{VARIETY_INSTRUCTIONS}

## STRUCTURE RULES - VERY IMPORTANT
**TikTok slideshows do NOT follow presentation rules!**

For each slide, look at the extracted text and decide:

1. **If the slide has a clear heading/title at the top:**
   - Put it in <H1>
   - Put remaining text in <P> tags

2. **If the slide has NO heading (just text/quotes/statements):**
   - Put the FIRST line or main text in <H1>
   - Put remaining lines in <P> tags (if any)

3. **If the slide has multiple quotes/statements:**
   - Put the first one in <H1>
   - Put each additional one in separate <P> tags

## OUTPUT FORMAT
\`\`\`xml
<PRESENTATION>
  <SECTION>
    <H1>First line or main heading from the slide</H1>
    <P>Additional text if present</P>
  </SECTION>

  <SECTION>
    <H1>Only text line on this slide</H1>
  </SECTION>

  <SECTION>
    <H1>First quote or statement</H1>
    <P>Second quote or statement</P>
    <P>Third quote or statement</P>
  </SECTION>
</PRESENTATION>
\`\`\`

## EXAMPLES

**Example 1 - Single line slide:**
Extracted: "If your man ever says these..."
Output:
\`\`\`xml
<SECTION>
  <H1>If your man ever says these...</H1>
</SECTION>
\`\`\`

**Example 2 - Multiple quotes:**
Extracted:
"Delete him."
"Don't drink."
"Don't smoke."

Output:
\`\`\`xml
<SECTION>
  <H1>"Delete him."</H1>
  <P>"Don't drink."</P>
  <P>"Don't smoke."</P>
</SECTION>
\`\`\`

**Example 3 - Heading + body text:**
Extracted:
Congratulations.
You actually have a man who genuinely cares about you.

Output:
\`\`\`xml
<SECTION>
  <H1>Congratulations.</H1>
  <P>You actually have a man who genuinely cares about you.</P>
</SECTION>
\`\`\`

## CRITICAL RULES
1. Generate exactly {TOTAL_SLIDES} slides
2. Copy the EXACT wording - do NOT rephrase, summarize, or add content
3. NEVER use placeholder text like "Slide Title" - use the ACTUAL text from the slide
4. Use only these XML tags: PRESENTATION, SECTION, H1, P
5. Match the original structure - if a slide has one line, use only H1. If multiple lines, split appropriately
6. Preserve line breaks, quotes, punctuation exactly as extracted
7. Keep the same casual/formal tone as the original

Now recreate the slideshow with {TOTAL_SLIDES} slides using the extracted text above.
`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slides, language, tone = "professional", variety = 0 } =
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

    console.log("=".repeat(80));
    console.log("IMAGE URLS TO ANALYZE:", imageUrls.length, "images");
    imageUrls.forEach((url, i) => {
      console.log(`  Image ${i + 1}:`, url.substring(0, 100) + (url.length > 100 ? "..." : ""));
    });
    console.log("=".repeat(80));

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
          max_tokens: 4000, // Increased for longer text extraction
        }),
      },
    );

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json().catch(() => null);
      console.error("=".repeat(80));
      console.error("VISION API ERROR - Status:", visionResponse.status);
      console.error("Error data:", JSON.stringify(errorData, null, 2));
      console.error("=".repeat(80));
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

    console.log("=".repeat(80));
    console.log("VISION API RESPONSE:");
    console.log("Full response:", JSON.stringify(visionData, null, 2));
    console.log("=".repeat(80));

    const extractedText = visionData.choices?.[0]?.message?.content?.trim();

    if (!extractedText) {
      console.error("=".repeat(80));
      console.error("VISION API - No text extracted!");
      console.error("Response structure:", visionData);
      console.error("=".repeat(80));
      return NextResponse.json(
        { error: "No text extracted from slides" },
        { status: 500 },
      );
    }

    // Check if the response indicates inability to process images
    if (
      extractedText.toLowerCase().includes("unable to extract") ||
      extractedText.toLowerCase().includes("cannot extract") ||
      extractedText.toLowerCase().includes("can't extract")
    ) {
      console.error("=".repeat(80));
      console.error("VISION API - Model refused to extract text");
      console.error("Response:", extractedText);
      console.error("This likely means the images are not accessible or in wrong format");
      console.error("=".repeat(80));
      return NextResponse.json(
        {
          error:
            "Vision API could not process the images. Please check if images are publicly accessible.",
        },
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

    // Generate variety-based instructions
    let varietyInstructions = "";
    if (variety === 0) {
      varietyInstructions = "Recreate each slide in XML format, preserving the EXACT text content from the original. Copy the wording word-for-word.";
    } else if (variety === 25) {
      varietyInstructions = "Recreate the slideshow with SLIGHT variations. Keep 75% of the original text but rephrase some words or use synonyms. Maintain the same message and tone.";
    } else if (variety === 50) {
      varietyInstructions = "Create a slideshow with MODERATE changes. Keep the same topics and structure but rewrite about 50% of the content with new wording. The message should be similar but expressed differently.";
    } else if (variety === 75) {
      varietyInstructions = "Create a slideshow with SIGNIFICANT differences. Use the extracted text as inspiration but change most of the content (75%). Keep the same structure and number of slides, but present the information in a notably different way.";
    } else { // variety === 100
      varietyInstructions = "Create a COMPLETELY DIFFERENT slideshow. Use the extracted text only to understand the structure (how many slides, what elements per slide). Generate entirely new content on a different topic, but maintain the exact same structure (same number of slides, same H1/P layout per slide).";
    }

    const formattedPrompt = xmlGenerationTemplate
      .replace(/{TITLE}/g, title)
      .replace(/{LANGUAGE}/g, language)
      .replace(/{TONE}/g, tone)
      .replace(/{TOTAL_SLIDES}/g, imageUrls.length.toString())
      .replace(/{CURRENT_DATE}/g, currentDate)
      .replace(/{VARIETY}/g, variety.toString())
      .replace(/{VARIETY_INSTRUCTIONS}/g, varietyInstructions)
      .replace(/{SLIDE_TEXT_CONTENT}/g, extractedText);

    const model = openai("gpt-4o");

    console.log("=".repeat(80));
    console.log("TEMPLATE GENERATION - EXTRACTED TEXT FROM IMAGES:");
    console.log("=".repeat(80));
    console.log(extractedText);
    console.log("=".repeat(80));
    console.log("TEMPLATE GENERATION - PROMPT SENT TO LLM:");
    console.log("=".repeat(80));
    console.log(formattedPrompt);
    console.log("=".repeat(80));

    const result = streamText({
      model,
      prompt: formattedPrompt,
      temperature: 0.5,
      onFinish: ({ text }) => {
        console.log("=".repeat(80));
        console.log("TEMPLATE GENERATION - LLM XML RESPONSE:");
        console.log("=".repeat(80));
        console.log(text);
        console.log("=".repeat(80));
      },
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

import { modelPicker } from "@/lib/model-picker";
import { auth } from "@/server/auth";
import { streamText } from "ai";
import { NextResponse } from "next/server";
// Use AI SDK types for proper type safety

interface SlidesRequest {
  title: string; // Generated presentation title
  prompt: string; // Original user prompt/request
  outline: string[]; // Array of main topics with markdown content
  language: string; // Language to use for the slides
  tone: string; // Style for image queries (optional)
  modelProvider?: string; // Model provider (openai, ollama, or lmstudio)
  modelId?: string; // Specific model ID for the provider
  searchResults?: Array<{ query: string; results: unknown[] }>; // Search results for context
}
// TODO: Add table and chart to the available layouts
const slidesTemplate = `
You are an expert presentation writer. Your task is to create a clear, text-only presentation in XML format.

## CORE REQUIREMENTS

1. FORMAT: Use <SECTION> tags for each slide.
2. CONTENT: Expand on the outline topics with cohesive paragraphs of text.
3. SIMPLICITY: Do NOT use any layout components (BOXES, BULLETS, ICONS, TABLE, CHART, etc.).
4. TEXT ONLY: Each slide must contain exactly one <H1> heading and one or more <P> paragraphs. No images or visual elements.

## PRESENTATION DETAILS
- Title: {TITLE}
- User's Original Request: {PROMPT}
- Current Date: {CURRENT_DATE}
- Outline (for reference only): {OUTLINE_FORMATTED}
- Language: {LANGUAGE}
- Tone: {TONE}
- Total Slides: {TOTAL_SLIDES}

## RESEARCH CONTEXT
{SEARCH_RESULTS}

## OUTPUT TEMPLATE
\`\`\`xml
<PRESENTATION>
  <SECTION>
    <H1>Slide Title</H1>
    <P>Paragraph text that expands on the outline topic with clear, informative prose.</P>
    <P>Optional supporting paragraph providing additional context or examples.</P>
  </SECTION>

  <!-- Additional SECTION blocks, one per slide -->
</PRESENTATION>
\`\`\`

## WRITING GUIDELINES
- Begin each slide with a descriptive title inside <H1>.
- Follow with 1-3 paragraphs (2-4 sentences each) that fully develop the idea.
- Avoid bullet lists, numbered lists, tables, charts, or any other structural tags.
- Do not include images, IMG tags, or layout attributes.
- Reference research findings when relevant, keeping the tone professional and consistent.

## CRITICAL RULES
1. Generate exactly {TOTAL_SLIDES} slides. Not more, not less.
2. Do not copy the outline verbatim; elaborate in complete sentences.
3. Ensure every slide is self-contained yet flows logically with the presentation.
4. Use only the XML tags shown above. Do not invent new tags or attributes.

Now create a complete XML presentation with {TOTAL_SLIDES} slides using this text-only structure.
`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      prompt: userPrompt,
      outline,
      language,
      tone,
      modelProvider = "openai",
      modelId,
      searchResults,
    } = (await req.json()) as SlidesRequest;

    if (!title || !outline || !Array.isArray(outline) || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Format search results
    let searchResultsText = "No research data available.";
    if (searchResults && searchResults.length > 0) {
      const searchData = searchResults
        .map((searchItem, index: number) => {
          const query = searchItem.query || `Search ${index + 1}`;
          const results = Array.isArray(searchItem.results)
            ? searchItem.results
            : [];

          if (results.length === 0) return "";

          const formattedResults = results
            .map((result: unknown) => {
              const resultObj = result as Record<string, unknown>;
              return `- ${resultObj.title || "No title"}\n  ${resultObj.content || "No content"}\n  ${resultObj.url || "No URL"}`;
            })
            .join("\n");

          return `**Search Query ${index + 1}:** ${query}\n**Results:**\n${formattedResults}\n---`;
        })
        .filter(Boolean)
        .join("\n\n");

      if (searchData) {
        searchResultsText = `The following research was conducted during outline generation:\n\n${searchData}`;
      }
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const model = modelPicker(modelProvider, modelId);

    // Format the prompt with template variables
    const formattedPrompt = slidesTemplate
      .replace(/{TITLE}/g, title)
      .replace(/{PROMPT}/g, userPrompt || "No specific prompt provided")
      .replace(/{CURRENT_DATE}/g, currentDate)
      .replace(/{LANGUAGE}/g, language)
      .replace(/{TONE}/g, tone)
      .replace(/{OUTLINE_FORMATTED}/g, outline.join("\n\n"))
      .replace(/{TOTAL_SLIDES}/g, outline.length.toString())
      .replace(/{SEARCH_RESULTS}/g, searchResultsText);

    console.log("=".repeat(80));
    console.log("PRESENTATION GENERATION - PROMPT SENT TO LLM:");
    console.log("=".repeat(80));
    console.log(formattedPrompt);
    console.log("=".repeat(80));

    const result = streamText({
      model,
      prompt: formattedPrompt,
      onFinish: ({ text }) => {
        console.log("=".repeat(80));
        console.log("PRESENTATION GENERATION - LLM XML RESPONSE:");
        console.log("=".repeat(80));
        console.log(text);
        console.log("=".repeat(80));
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in presentation generation:", error);
    return NextResponse.json(
      { error: "Failed to generate presentation slides" },
      { status: 500 },
    );
  }
}

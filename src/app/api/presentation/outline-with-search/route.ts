import { modelPicker } from "@/lib/model-picker";
import { auth } from "@/server/auth";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { search_tool } from "./search_tool";

interface OutlineRequest {
  prompt: string;
  numberOfCards: number;
  language: string;
  modelProvider?: string;
  modelId?: string;
}

const outlineSystemPrompt = `You are an expert TikTok slideshow script writer with web research capabilities. Create a compelling script with exactly {numberOfCards} slides in {language}.

Current Date: {currentDate}

## YOUR PROCESS:
1. **Analyze the user's request** - Understand their tone, style, format, and content requirements
2. **Use web search strategically** (optional) - Find current statistics, trends, or expert insights that enhance credibility
3. **Generate the script** - Create exactly {numberOfCards} slides following the user's specifications

## WEB SEARCH GUIDELINES:
- Use web search to find current, relevant information that adds value
- Limit searches to 2-5 queries maximum (only when truly beneficial)
- Focus on recent statistics, expert insights, or trending topics
- Don't search if the user's request is self-contained or opinion-based

## CRITICAL RULES:
1. **RESPECT USER'S INSTRUCTIONS**: If they specify a format (bullet points, numbered items, paragraphs), follow it exactly
2. **FOLLOW SPECIFIED PATTERNS**: If they request "habit name + 3 bullet points", maintain that structure consistently
3. **HONOR TONE & STYLE**: Match the exact tone requested (authoritative, coaching, casual, etc.)
4. **SLIDE COUNT**: Generate EXACTLY {numberOfCards} slides
5. **LINE NUMBERING**: Start every line with "<number>. " and continue sequentially
6. **CONSISTENCY**: If slide 2 has a certain structure, maintain it for similar slides

## CONTENT GUIDELINES:
- Keep text concise but impactful (2-4 lines per slide ideal for TikTok)
- Use line breaks within slide content for readability
- If user requests bullet points, use "•" or "-"
- If user requests numbered sub-items, include them
- First slide: compelling hook/title
- Last slide: conclusion, CTA, or motivational message
- Avoid hashtags/emojis UNLESS specifically requested

## OUTPUT FORMAT:
Return ONLY a numbered list where each number represents one slide.

Example for a habit-breaking topic:
1. 7 habits that are secretly killing your potential
2. 1. Constant self-doubt
• You talk yourself out of opportunities before trying
• You assume others are more qualified than you
• You replay past mistakes more than past successes
3. 2. Waiting for perfect timing
• You delay important decisions waiting for the moment
• You let opportunities pass while preparing endlessly
• You mistake hesitation for being thorough

Remember: Use web search strategically to enhance the script with current, credible information when it adds value.`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      prompt,
      numberOfCards,
      language,
      modelProvider = "openai",
      modelId,
    } = (await req.json()) as OutlineRequest;

    if (!prompt || !numberOfCards || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const languageMap: Record<string, string> = {
      "en-US": "English (US)",
      pt: "Portuguese",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
      ru: "Russian",
      hi: "Hindi",
      ar: "Arabic",
    };

    const actualLanguage = languageMap[language] ?? language;
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create model based on selection
    const model = modelPicker(modelProvider, modelId);

    const result = streamText({
      model,
      system: outlineSystemPrompt
        .replace("{numberOfCards}", numberOfCards.toString())
        .replace("{language}", actualLanguage)
        .replace("{currentDate}", currentDate),
      messages: [
        {
          role: "user",
          content: `Create a presentation outline for: ${prompt}`,
        },
      ],
      tools: {
        webSearch: search_tool,
      },
      maxSteps: 5, // Allow up to 5 tool calls
      toolChoice: "auto", // Let the model decide when to use tools
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in outline generation with search:", error);
    return NextResponse.json(
      { error: "Failed to generate outline with search" },
      { status: 500 },
    );
  }
}

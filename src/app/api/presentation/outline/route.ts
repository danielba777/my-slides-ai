import { modelPicker } from "@/lib/model-picker";
import { auth } from "@/server/auth";
import { streamText } from "ai";
import { NextResponse } from "next/server";

interface OutlineRequest {
  prompt: string;
  numberOfCards: number;
  language: string;
  modelProvider?: string;
  modelId?: string;
}

const outlineTemplate = `You are an expert TikTok slideshow script writer. Create a compelling script with exactly {numberOfCards} slides in {language}.

Current Date: {currentDate}
User Request (MUST follow all tone/style/format directives): {prompt}

## YOUR TASK:
Analyze the user's request carefully. They may specify:
- A specific tone (e.g., authoritative, coaching, conversational)
- A particular structure (e.g., numbered habits, steps, tips)
- Content format (e.g., bullet points, short sentences, paragraphs)
- Reading level and style preferences

## CRITICAL RULES:
1. **RESPECT THE USER'S INSTRUCTIONS**: If they want bullet points, provide bullet points. If they want numbered items with sub-points, provide that exact structure.
2. **FOLLOW THE SPECIFIED FORMAT**: The user may request specific patterns (e.g., "habit name followed by 3 bullet points"). Follow this precisely.
3. **MAINTAIN CONSISTENCY**: If slide 2 has a certain structure, slides 3-7 should follow the same pattern (unless the user specifies otherwise).
4. **HONOR TONE & STYLE**: Match the requested tone exactly (authoritative, coaching, casual, etc.).
5. **SLIDE COUNT**: Generate EXACTLY {numberOfCards} slides. First slide is typically a title/hook, last slide is typically a conclusion/CTA.
6. **LINE NUMBERING**: Start every line with "<number>. " (e.g., "1. ", "2. ", etc.) and continue sequentially.

## CONTENT GUIDELINES:
- Keep text concise but impactful (2-4 lines per slide is ideal for TikTok)
- Use line breaks within a slide content when appropriate for readability
- If the user requests bullet points, use "•" or "-" for bullets
- If the user requests numbered sub-items, include them (e.g., "1. Main point")
- Avoid hashtags, emojis, or excessive punctuation UNLESS the user requests them
- First slide should be a compelling hook/title
- Last slide should provide closure (conclusion, CTA, or motivational message)

## OUTPUT FORMAT:
Return ONLY a numbered list. Each number represents one slide. The content after each number is what appears on that slide.

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

Now generate exactly {numberOfCards} slides following the user's instructions:
`;

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

    const actualLanguage = languageMap[language] ?? language; // Fallback to the original if not found
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const model = modelPicker(modelProvider, modelId);

    // Format the prompt with template variables
    const formattedPrompt = outlineTemplate
      .replace(/{numberOfCards}/g, numberOfCards.toString())
      .replace(/{language}/g, actualLanguage)
      .replace(/{currentDate}/g, currentDate)
      .replace(/{prompt}/g, prompt);

    const result = streamText({
      model,
      prompt: formattedPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in outline generation:", error);
    return NextResponse.json(
      { error: "Failed to generate outline" },
      { status: 500 },
    );
  }
}

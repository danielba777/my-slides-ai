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

const outlineTemplate = `Given the following topic and requirements, generate a TikTok slideshow script with exactly {numberOfCards} slides in {language}.

Current Date: {currentDate}
Topic (may include tone/style directives you MUST follow): {prompt}

Rules:
1) Each slide is ONE short sentence only (max 12 words, ≤60 characters).
2) No paragraphs. No extra commentary. No hashtags. No emojis. No quotes.
3) Do NOT include a title unless the topic explicitly asks for one.
4) Keep wording punchy, conversational, and easy to read (≈ Grade 6–8).
5) Avoid repeating the same words across multiple slides where possible.
6) Respect any sequencing in the topic (e.g., progression from A to B to C).
7) No numbering inside the sentence itself.
8) Start every line with "<index>. " (number, period, space) and continue numbering sequentially.

Output format (return ONLY this numbered list, nothing else):
1. <slide 1 sentence>
2. <slide 2 sentence>
...
{numberOfCards}. <slide {numberOfCards} sentence>
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

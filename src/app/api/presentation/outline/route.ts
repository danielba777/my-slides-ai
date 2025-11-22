import { modelPicker } from "@/lib/model-picker";
import { auth } from "@/server/auth";
import { streamText } from "ai";
import { NextResponse } from "next/server";

const defaultSampling = () => ({
  temperature: 1.1,
  topP: 1.0,
  frequencyPenalty: 0.5,
  presencePenalty: 0.8,
  seed: Math.floor(Math.random() * 2_000_000_000),
});

interface OutlineRequest {
  prompt: string;
  numberOfCards: number;
  language: string;
  modelProvider?: string;
  modelId?: string;
  diversitySeed?: number;
}

const outlineTemplate = `You are an expert TikTok slideshow script writer and layout designer. Create a compelling script with exactly {numberOfCards} slides in {language}.

Current Date: {currentDate}
Creative diversity token: {diversitySig}
Variation directive: {variationDirective}
User Request (MUST follow all tone/style/format directives): {prompt}

## YOUR TASK:
Analyze the user's request carefully. Create content AND layout specifications for each slide.

## CRITICAL RULES:
1. **RESPECT THE USER'S INSTRUCTIONS**: If they want bullet points, provide bullet points.
2. **FOLLOW THE SPECIFIED FORMAT**: The user may request specific patterns.
3. **MAINTAIN CONSISTENCY**: If slide 2 has a certain structure, slides 3–7 should follow the same pattern.
4. **HONOR TONE & STYLE**: Match the requested tone exactly.
5. **SLIDE COUNT**: Generate EXACTLY {numberOfCards} slides.
6. **OUTPUT FORMAT**: Return a valid JSON array of objects.

## DIVERSITY & NOVELTY RULES (VERY IMPORTANT):
- Do **not** repeat the same idea with different wording.
- Each slide must introduce a **distinct primary concept/ingredient**.
- Use at least **3 uncommon** but realistic ideas.
- Do not reuse the same primary noun/base ingredient across slides.

## LAYOUT SPECIFICATIONS:
For each slide, you must provide:
- \`text\`: The content of the slide.
- \`fontSize\`: Font size in pixels (e.g., "48px"). Use larger sizes (50-80px) for titles/short text, smaller (30-50px) for longer text.
- \`textSize\`: Object with \`width\` and \`height\` in pixels. Max width is 1000. Estimate height based on text length.
- \`textPosition\`: Object with \`x\` and \`y\` coordinates. Canvas size is 1080x1920. Center is approx x=540. y position should vary (e.g., title higher up).
- \`textStyle\`: Always "outline".

## OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown formatting, no code blocks. Just the raw JSON array.

Example:
[
  {
    "text": "7 habits that are secretly killing your potential",
    "fontSize": "64px",
    "textSize": { "width": 900, "height": 200 },
    "textPosition": { "x": 540, "y": 400 },
    "textStyle": "outline"
  },
  {
    "text": "1. Constant self-doubt\\n• You talk yourself out of opportunities\\n• You assume others are more qualified",
    "fontSize": "42px",
    "textSize": { "width": 950, "height": 600 },
    "textPosition": { "x": 540, "y": 960 },
    "textStyle": "outline"
  }
]

Now generate exactly {numberOfCards} slides following the user's instructions **and the diversity rules** as a JSON array:
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
      diversitySeed,
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

    
    const diversitySig = Math.random().toString(36).slice(2, 10);
    const variabilityDirectives = [
      "Focus on underrated, lesser-known examples that people rarely mention.",
      "Pull from multiple cuisines and regional traditions; include at least one international idea.",
      "Prioritize seasonal and fresh options; avoid common grocery staples.",
      "Emphasize no‑cook, minimal‑prep ideas that feel novel.",
      "Favor high‑protein or high‑fiber angles without repeating ingredients.",
      "Include at least one savory, one sweet, and one crunchy option.",
    ];
    const variationDirective =
      variabilityDirectives[
        Math.floor(Math.random() * variabilityDirectives.length)
      ] ?? "";

    const model = modelPicker(modelProvider, modelId);

    
    const formattedPrompt = outlineTemplate
      .replace(/{numberOfCards}/g, numberOfCards.toString())
      .replace(/{language}/g, actualLanguage)
      .replace(/{currentDate}/g, currentDate)
      .replace(/{diversitySig}/g, diversitySig)
      .replace(/{variationDirective}/g, variationDirective)
      .replace(/{prompt}/g, prompt);

    const sampling = defaultSampling();
    if (typeof diversitySeed === "number" && Number.isFinite(diversitySeed)) {
      sampling.seed = Math.trunc(diversitySeed);
    }

    const result = streamText({
      model,
      prompt: formattedPrompt,
      temperature: sampling.temperature,
      topP: sampling.topP,
      frequencyPenalty: sampling.frequencyPenalty,
      presencePenalty: sampling.presencePenalty,
      seed: sampling.seed,
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

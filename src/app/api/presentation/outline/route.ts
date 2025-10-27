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

const outlineTemplate = `You are an expert TikTok slideshow script writer. Create a compelling script with exactly {numberOfCards} slides in {language}.

Current Date: {currentDate}
Creative diversity token: {diversitySig}
Variation directive: {variationDirective}
User Request (MUST follow all tone/style/format directives): {prompt}

## YOUR TASK:
Analyze the user's request carefully. They may specify:
- A specific tone (e.g., authoritative, coaching, conversational)
- A particular structure (e.g., numbered habits, steps, tips)
- Content format (e.g., bullet points, short sentences, captions)
- Reading level and style preferences

## CRITICAL RULES:
1. **RESPECT THE USER'S INSTRUCTIONS**: If they want bullet points, provide bullet points. If they want numbered items with sub-points, provide that exact structure.
2. **FOLLOW THE SPECIFIED FORMAT**: The user may request specific patterns (e.g., "habit name followed by 3 bullet points"). Follow this precisely.
3. **MAINTAIN CONSISTENCY**: If slide 2 has a certain structure, slides 3–7 should follow the same pattern (unless the user specifies otherwise).
4. **HONOR TONE & STYLE**: Match the requested tone exactly (authoritative, coaching, casual, etc.).
5. **SLIDE COUNT**: Generate EXACTLY {numberOfCards} slides. First slide is typically a title/hook, last slide is typically a conclusion/CTA.
6. **LINE NUMBERING**: Start every line with "<number>. " (e.g., "1. ", "2. ", etc.) and continue sequentially.

## DIVERSITY & NOVELTY RULES (VERY IMPORTANT):
- Do **not** repeat the same idea with different wording.
- Each slide must introduce a **distinct primary concept/ingredient**.
- Vary across: base ingredient, preparation method (no‑cook / baked / frozen / pan), flavor profile (sweet / savory / spicy / tangy), texture (crunchy / creamy / chewy), occasion (desk snack / post‑workout / travel / movie night), cuisine (at least one non‑local).
- Strictly avoid overused examples unless explicitly requested. For snack topics, AVOID: yogurt parfait, apple + peanut butter, hummus & carrots, smoothie bowl, trail mix.
- Use at least **3 uncommon** but realistic ideas.
- Do not reuse the same primary noun/base ingredient across slides.
- Vary micro‑phrasing; avoid repeating the same sentence stems.
- If the user requests caption‑style text, keep it concise and **no full sentences**.

## CONTENT GUIDELINES:
- Keep text concise but impactful (2–4 lines per slide is ideal for TikTok)
- Use line breaks within a slide when helpful
- If the user requests bullet points, use "•" or "-" for bullets
- If the user requests numbered sub‑items, include them
- Avoid hashtags, emojis, or excessive punctuation UNLESS requested
- First slide should be a compelling hook/title
- Last slide should provide closure (conclusion, CTA, or motivational message)

## OUTPUT FORMAT:
Return ONLY a numbered list. Each number represents one slide. The content after each number is what appears on that slide.

Example for a habit‑breaking topic:
1. 7 habits that are secretly killing your potential
2. 1. Constant self-doubt
• You talk yourself out of opportunities before trying
• You assume others are more qualified than you
• You replay past mistakes more than past successes
3. 2. Waiting for perfect timing
• You delay important decisions waiting for the moment
• You let opportunities pass while preparing endlessly
• You mistake hesitation for being thorough

Now generate exactly {numberOfCards} slides following the user's instructions **and the diversity rules**:
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

    const actualLanguage = languageMap[language] ?? language; // Fallback to the original if not found
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Add a per-request diversity signature and a random variation directive to boost variety
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

    // Format the prompt with template variables
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

import { env } from "@/env";
import { auth } from "@/server/auth";
import { NextRequest, NextResponse } from "next/server";

interface Slide {
  id: string;
  imageUrl: string;
  slideIndex?: number;
}

interface RequestBody {
  postId: string;
  slides: Slide[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;
    const { postId, slides } = body;

    if (!postId || !slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "Missing postId or slides" },
        { status: 400 },
      );
    }

    
    const imageUrls = slides
      .filter((slide) => slide.imageUrl)
      .sort((a, b) => (a.slideIndex ?? 0) - (b.slideIndex ?? 0))
      .map((slide) => slide.imageUrl);

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid images found in slides" },
        { status: 400 },
      );
    }

    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "OpenAI API not configured" },
        { status: 500 },
      );
    }

    
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: string } }
    > = [
      {
        type: "text",
        text: `Analyze these TikTok slideshow images and produce a SINGLE, fully‑specified slideshow generation prompt in the exact detailed style of the examples below. Your output must be one paragraph (no bullets) between 120 and 220 words.

TASK
1) From the visible slide text, infer:
- topic/subject
- tone and writing style
- point of view (1st vs 2nd person)
- approximate reading level (grade)
- structural pattern (e.g., numbered list, repeated phrase, quote cadence, cheat‑sheet headings)
- any visible first‑slide headline; if none is clearly visible, invent a short, on‑brand headline consistent with the style.

2) Compose the final prompt starting exactly like this:
“I want [number] slides about ‘[inferred topic]’ and I want the first slide text to say ‘[headline]’, written in a [tone descriptor] tone using [point of view] with [clear structural guidance]. Write at a [grade level] reading level in a [voice/style] style.”

3) Continue the paragraph by specifying:
- sentence style (short/impactful vs. lyrical), formatting cues (headings, bullets, numbered items, repeated phrase), and lexicon cues relevant to the niche
- what each slide after the first must contain (e.g., one numbered item + brief rationale; or a repeated clause pattern)
- any constraints to ensure variety (no reused phrasings; mix of verbs; forbid generic fillers like “stay consistent” unless supported)
- audience focus and outcome (what the reader should be able to do)

STRICT OUTPUT RULES
- Output ONLY the final prompt paragraph. No notes or explanations.
- Must follow the examples’ density and specificity.

Examples (style reference only – DO NOT copy content):
Example 1: I want 9 slides about 'fitness tips for women at the gym' and I want the first slide text to say 'Screenshots every gym girl needs in her camera roll', written in an educational, informative tone using second person "you" with clear instructional formatting. Write at a 9th grade reading level in a knowledgeable fitness coach style. Use concise, direct sentences with clear headings and bullet points. Include specific fitness terminology and practical advice. Each slide should present a different fitness concept with a clear title/heading followed by practical information organized in an easy-to-reference format. Focus on creating a "cheat sheet" feel with actionable gym tips specifically for women.

Example 2: I want 8 slides about 'things successful people keep private' with the first slide text saying '7 things you must keep private', written in an authoritative, direct tone using second-person perspective. Write at an 8th grade reading level in a confident coaching style, positioning yourself as a mentor sharing insider knowledge. Use short, impactful sentences with occasional fragments for emphasis. Include numbered advice (1-7) with brief explanations that highlight consequences of oversharing. Each slide after the first should contain one numbered item and a concise explanation of why it should remain private. Maintain a serious, no-nonsense tone throughout with practical wisdom that feels exclusive and valuable.

Example 3: I want 7 slides about 'romantic promises' with the first slide text saying 'Forever the boy who will never raise his voice at you.' Written in a romantic, sincere tone using first person perspective. Write at a 7th grade reading level in a style that sounds like someone making heartfelt promises to their partner. Use short, simple sentences with periods for a gentle, affirming rhythm. Each slide should start with "Forever the boy who..." followed by a specific promise or commitment, creating a pattern of devotion. The final slide should simply say "Forever the boy." to conclude the progression. Keep the language tender and protective, focusing on ways to care for and cherish someone.`,
      },
    ];

    
    for (const url of imageUrls) {
      content.push({
        type: "image_url",
        image_url: {
          url: url,
          detail: "high",
        },
      });
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.8,
          messages: [
            {
              role: "user",
              content: content,
            },
          ],
          max_tokens: 700,
        }),
      },
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => null);
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate prompt with OpenAI" },
        { status: openaiResponse.status },
      );
    }

    const openaiData = (await openaiResponse.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const generatedPrompt =
      openaiData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!generatedPrompt) {
      return NextResponse.json(
        { error: "No prompt generated" },
        { status: 500 },
      );
    }

    
    const apiBaseUrl = env.SLIDESCOCKPIT_API;
    const saveResponse = await fetch(
      `${apiBaseUrl}/slideshow-library/posts/${postId}/prompt`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: generatedPrompt }),
      },
    );

    if (!saveResponse.ok) {
      console.error("Failed to save prompt to backend");
      
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}

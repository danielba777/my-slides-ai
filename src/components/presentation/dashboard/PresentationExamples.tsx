import { fetchPresentations } from "@/app/_actions/presentation/fetchPresentations";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Shuffle } from "lucide-react";
import { useState } from "react";

export const EXAMPLE_PROMPTS = [
  {
    id: "habits-structure",
    icon: "📋",
    title: "Underrated habits prompt",
    prompt:
      "I want 6 slides about 'underrated habits that build structure' with the first slide text saying '5 underrated habits that build quick structure:' written in an authoritative, instructional tone using second-person perspective. Write at a 9th grade reading level in a coaching style that positions you as a knowledgeable mentor. Use short, direct sentences with minimal punctuation beyond periods. Each slide after the first should present one habit with a brief explanation of its impact. Format habits as numbered points (1-5) with concise descriptions that emphasize practical benefits. Maintain a minimalist, straightforward approach focused on actionable advice. Each slide should have 1-3 text items, with the first being the habit number and name, followed by 1-2 supporting points that explain the psychological benefit.",
    slides: 6,
    lang: "en-US",
    style: "professional",
    color: { background: "rgba(168, 85, 247, 0.1)", color: "#A855F7" },
  },
  {
    id: "seo-audit",
    icon: "🔍",
    title: "SEO audit prompt",
    prompt:
      "Create an 8-slide presentation titled 'Realistic SEO Audit Roadmap'. First slide should list the promise: 'Your site can rank—here's what to fix first.' Use a practical consultant tone. Slide 2 should outline the audit structure (Technical, Content, Authority). Slides 3-7 should drill into each phase with numbered tasks, each task limited to 2 bullet points with clear metrics or outcomes. Final slide should summarize next 30-day actions. Keep language concise, directive, and free of marketing fluff.",
    slides: 8,
    lang: "en-US",
    style: "professional",
    color: { background: "rgba(6, 182, 212, 0.1)", color: "#06B6D4" },
  },
  {
    id: "founder-update",
    icon: "📈",
    title: "Founder update prompt",
    prompt:
      "Draft a 7-slide investor update for a Series A SaaS company growing 12% MoM. Slide 1: headline metrics (ARR, net dollar retention, burn multiple). Slide 2: what's working (product usage highlights). Slide 3: what's not working (pipeline, churn). Slide 4: hires in last 60 days with roles. Slide 5: roadmap commitments for next quarter (3 bullet points). Slide 6: capital runway scenarios (base vs stretch). Slide 7: asks from investors (intros, hiring help). Use concise bullet points and avoid jargon.",
    slides: 7,
    lang: "en-US",
    style: "professional",
    color: { background: "rgba(34, 197, 94, 0.1)", color: "#22C55E" },
  },
  {
    id: "wellness-coach",
    icon: "🧘",
    title: "Wellness routine prompt",
    prompt:
      "Build a 5-slide presentation titled 'Reset Your Evenings in 20 Minutes'. Slide 1: promise statement and target audience. Slides 2-4: each slide should contain a numbered ritual with 2 bullet points (what to do + why it works) focusing on nervous system regulation. Slide 5: checklist summarizing all rituals. Use warm, empathetic coaching language with clear action verbs and keep sentences under 14 words.",
    slides: 5,
    lang: "en-US",
    style: "traditional",
    color: { background: "rgba(239, 68, 68, 0.1)", color: "#EF4444" },
  },
];

export function PresentationExamples() {
  const [examples, setExamples] = useState(EXAMPLE_PROMPTS.slice(0, 6));
  const { setNumSlides, setLanguage, setPageStyle, setPresentationInput } =
    usePresentationState();

  
  const { data, isLoading: isPresentationsLoading } = useInfiniteQuery({
    queryKey: ["presentations-all"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetchPresentations(pageParam);
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? 0 : 0),
  });

  
  const presentationsPages = data?.pages;
  const hasPresentations = !!presentationsPages?.[0]?.items?.length;

  
  if (isPresentationsLoading || hasPresentations) return null;

  const handleExampleClick = (example: (typeof EXAMPLE_PROMPTS)[0]) => {
    setPresentationInput(example.prompt);
    setNumSlides(example.slides);
    setLanguage(example.lang);
    setPageStyle(example.style);
  };

  const handleShuffle = () => {
    const shuffled = [...EXAMPLE_PROMPTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    setExamples(shuffled);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Try these examples
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShuffle}
          className="gap-2"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {examples.map((example) => (
          <button
            key={example.id}
            onClick={() => handleExampleClick(example)}
            className="group flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:bg-accent hover:shadow-sm"
          >
            <div
              className="rounded-lg p-2"
              style={{
                background: example.color.background,
                color: example.color.color,
              }}
            >
              <span className="text-lg">{example.icon}</span>
            </div>
            <span className="line-clamp-2 flex-1 text-sm font-medium text-card-foreground group-hover:text-accent-foreground">
              {example.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

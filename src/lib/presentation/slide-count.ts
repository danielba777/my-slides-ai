export function extractSlideCountFromPrompt(prompt: string): number | null {
  if (!prompt.trim()) {
    return null;
  }

  const normalized = prompt.toLowerCase();

  const clampCandidate = (value: string | number | undefined): number | null => {
    const numeric = typeof value === "number" ? value : Number.parseInt(`${value}`, 10);
    if (Number.isNaN(numeric)) {
      return null;
    }
    return numeric;
  };

  
  const rangePattern =
    /\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:slides?|cards?)\b/g;
  let rangeMatch: RegExpExecArray | null;
  let candidate: number | null = null;
  while ((rangeMatch = rangePattern.exec(normalized)) !== null) {
    candidate = clampCandidate(rangeMatch[2]);
  }
  if (candidate !== null) {
    return candidate;
  }

  const forwardPattern =
    /\b(\d{1,2})(?:\s*[-–—]?\s*)?(?:slides?|cards?)\b/g;
  let forwardMatch: RegExpExecArray | null;
  while ((forwardMatch = forwardPattern.exec(normalized)) !== null) {
    candidate = clampCandidate(forwardMatch[1]);
  }
  if (candidate !== null) {
    return candidate;
  }

  const backwardPattern =
    /\b(?:slides?|cards?)\s*(?:of|for|with|about|around)?\s*(\d{1,2})\b/g;
  let backwardMatch: RegExpExecArray | null;
  while ((backwardMatch = backwardPattern.exec(normalized)) !== null) {
    candidate = clampCandidate(backwardMatch[1]);
  }

  return candidate;
}

export function getEffectiveSlideCount(
  mode: "manual" | "auto",
  manualCount: number,
  prompt: string,
  options?: { min?: number; max?: number; fallback?: number },
): number {
  const min = options?.min ?? 1;
  const max = options?.max ?? 20;
  const fallback =
    options?.fallback ??
    (Number.isFinite(manualCount) && manualCount >= min ? manualCount : min);

  const clamp = (value: number): number =>
    Math.min(max, Math.max(min, Math.round(value)));

  if (mode === "auto") {
    const extracted = extractSlideCountFromPrompt(prompt);
    if (extracted !== null) {
      return clamp(extracted);
    }
    return clamp(fallback);
  }

  return clamp(manualCount);
}

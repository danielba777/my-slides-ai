// src/server/vendors/fal.ts
import { fal } from "@fal-ai/client";

function ensureFalKey() {
  const key = process.env.FAL_KEY || process.env.FAL_AI_KEY;
  if (!key) {
    throw new Error(
      "FAL_KEY (oder FAL_AI_KEY) fehlt. Bitte serverseitig als ENV setzen.",
    );
  }
  return key;
}

// Einmalig konfigurieren (keine baseUrl überschreiben!)
export function getFal() {
  const key = ensureFalKey();
  fal.config({ credentials: key });
  return fal;
}

export type PikaImageToVideoInput = {
  image_url: string;
  prompt: string;
  duration?: number; // default 5
  resolution?: "720p" | "1080p";
  aspect_ratio?: "16:9" | "9:16" | "1:1" | "4:5" | "5:4" | "3:2" | "2:3";
  mode?: "std" | "pro";
};

// Ein Helper, den du überall serverseitig aufrufen kannst
export async function pikaImageToVideo(input: PikaImageToVideoInput) {
  const sdk = getFal();

  // Minimalvalidierung
  if (!input?.image_url) throw new Error("image_url fehlt");
  if (!input?.prompt) throw new Error("prompt fehlt");

  const MODEL = "fal-ai/kling-video/v2.5-turbo/standard/image-to-video";

  const result = await sdk.subscribe(MODEL, {
    input: {
      image_url: input.image_url,
      prompt: input.prompt,
      duration: input.duration ?? 5,
      resolution: input.resolution ?? "720p",
      aspect_ratio: input.aspect_ratio ?? "9:16",
      mode: input.mode ?? "std",
    },
    logs: true,
  });

  // Erfolgsformat laut Doku: result.data.video.url
  const videoUrl = result?.data?.video?.url as string | undefined;
  if (!videoUrl) {
    // bessere Fehlermeldung für typische Fälle
    throw new Error(
      "Pika hat kein 'video.url' geliefert. Prüfe Input (image_url/prompt) oder Fal-Dashboard Logs.",
    );
  }
  return { requestId: result.requestId, videoUrl };
}

// ---- Abwärtskompatibler Wrapper für bestehende Aufrufer ----
// Signatur wie früher: createPikaImageToVideo(imageUrl, prompt, { durationSeconds, resolution, aspectRatio, mode })
export async function createPikaImageToVideo(
  imageUrl: string,
  prompt: string,
  opts?: {
    durationSeconds?: number;
    resolution?: "720p" | "1080p";
    aspectRatio?: "16:9" | "9:16" | "1:1" | "4:5" | "5:4" | "3:2" | "2:3";
    mode?: "std" | "pro";
  },
): Promise<string> {
  const { videoUrl } = await pikaImageToVideo({
    image_url: imageUrl,
    prompt,
    duration: Math.min(Math.max(opts?.durationSeconds ?? 5, 1), 10),
    resolution: opts?.resolution ?? "720p",
    // Pika v2.2 image-to-video ignoriert aspect_ratio/mode häufig; wir reichen sie durch, falls Fal sie künftig nutzt.
    aspect_ratio: opts?.aspectRatio ?? "9:16",
    mode: opts?.mode ?? "std",
  });
  return videoUrl;
}

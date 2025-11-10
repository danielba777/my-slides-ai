import { env } from "@/env";

const rawPostMode = env.NEXT_PUBLIC_TIKTOK_POST_MODE ?? "inbox";

export const DEFAULT_TIKTOK_POST_MODE: "DIRECT_POST" | "MEDIA_UPLOAD" =
  rawPostMode === "direct_post" ? "DIRECT_POST" : "MEDIA_UPLOAD";

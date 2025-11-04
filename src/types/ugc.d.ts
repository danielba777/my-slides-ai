export type ReactionAvatar = {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl: string;
  videoUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DemoVideo = {
  id: string;
  name?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  durationMs?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedVideoStatus = "DRAFT" | "PROCESSING" | "READY" | "FAILED";

export type GeneratedVideo = {
  id: string;
  userId: string;
  title?: string | null;
  reactionAvatarId?: string | null;
  demoVideoId?: string | null;
  compositeVideoUrl: string;
  compositeThumbnailUrl?: string | null;
  status: GeneratedVideoStatus;
  durationMs?: number | null;
  processedAt?: string | null;
  scheduleJobId?: string | null;
  scheduleRunAt?: string | null;
  rawSegments?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  reactionAvatar?: Pick<ReactionAvatar, "id" | "name" | "thumbnailUrl"> | null;
  demoVideo?: DemoVideo | null;
};


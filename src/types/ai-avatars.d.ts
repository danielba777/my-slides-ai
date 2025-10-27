export type AiAvatarTemplate = {
  id: string;
  prompt: string;
  imageUrl: string;
  rawImageUrl?: string;
  createdAt: string;
  jobId?: string | null;
};

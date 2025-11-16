import { createClient } from "redis";

if (!globalThis.redis) {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const client = createClient({ url });

  client.on("error", () => {});
  client.connect();

  globalThis.redis = client;
}

export const redis = globalThis.redis as ReturnType<typeof createClient>;
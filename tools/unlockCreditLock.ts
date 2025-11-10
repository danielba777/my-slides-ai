import { createClient } from "redis";
const redisUrl = process.env.REDIS_URL!;
const redis = createClient({ url: redisUrl });

async function unlockAll() {
  await redis.connect();
  const keys = await redis.keys("creditlock:*");
  if (keys.length === 0) return console.log("✅ Keine Locks gefunden");
  await redis.del(keys);
  console.log(`🗝️ Gelöscht: ${keys.length} Locks`, keys);
  await redis.quit();
}

unlockAll();

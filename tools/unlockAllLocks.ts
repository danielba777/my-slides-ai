import { createClient } from "redis";
import "dotenv/config";

async function unlockAll() {
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const keys = await redis.keys("creditlock:*");
  if (keys.length === 0) {
    console.log("✅ Keine Locks gefunden");
  } else {
    await redis.del(keys);
    console.log(`🗝️  Gelöscht: ${keys.length} Locks`, keys);
  }

  await redis.quit();
}

unlockAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
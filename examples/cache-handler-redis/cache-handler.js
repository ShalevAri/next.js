const { CacheHandler } = require("@neshca/cache-handler");
const createRedisCache = require("@neshca/cache-handler/redis-stack").default;
const createLruCache = require("@neshca/cache-handler/local-lru").default;
const { createClient } = require("redis");
const { PHASE_PRODUCTION_BUILD } = require("next/constants");

const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

client.on("error", (error) => {
  console.error("Redis error:", error.message);
});

CacheHandler.onCreation(async () => {
  // read more about TTL limitations https://caching-tools.github.io/next-shared-cache/configuration/ttl
  function useTtl(maxAge) {
    const evictionAge = maxAge * 1.5;

    return evictionAge;
  }

  let redisCache;

  if (PHASE_PRODUCTION_BUILD !== process.env.NEXT_PHASE) {
    await client.connect();

    redisCache = await createRedisCache({
      client,
      useTtl,
    });
  }

  const localCache = createLruCache({
    useTtl,
  });

  return {
    cache: [redisCache, localCache],
    // read more about useFileSystem limitations https://caching-tools.github.io/next-shared-cache/configuration/use-file-system
    useFileSystem: false,
  };
});

module.exports = CacheHandler;

import { Redis } from "ioredis";
import { server_env as env } from "@repo/env";

export class PostCache {
    private redis: Redis;
    // 5 minutes TTL for cached Post
    private readonly CACHE_TTL = 300;

    constructor() {
        const redisUrl = env.REDIS_HOST;
        if (!redisUrl) {
            console.warn("REDIS_CACHE_URL not found, using default 6380");
        }
        this.redis = new Redis(redisUrl || "redis://localhost:6380");

        this.redis.on("error", (err) => {
            console.error("[MessageCache] Redis error:", err);
        });
    }

    async addPost(key: string, messages: any[]): Promise<void> {
        if (!messages.length) return;
        try {
            await this.redis.setex(
                key,
                this.CACHE_TTL,
                JSON.stringify(messages),
            );
        } catch (error) {
            console.error("[MessageCache] Failed to cache messages:", error);
        }
    }

    async getPost(key: string): Promise<any[] | null> {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error("[MessageCache] Failed to retrieve messages:", error);
            return null;
        }
    }

    async invalidatePost(key: string): Promise<void> {
        try {
            await this.redis.del(key);
            console.log(`[PostCache] Invalidated key: ${key}`);
        } catch (error) {
            console.error("[PostCache] Failed to invalidate key:", error);
        }
    }

    async invalidateByPattern(pattern: string): Promise<void> {
        try {
            let cursor = "0";
            do {
                const [nextCursor, keys] = await this.redis.scan(
                    cursor,
                    "MATCH",
                    pattern,
                    "COUNT",
                    100,
                );
                cursor = nextCursor;
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    console.log(`[PostCache] Invalidated ${keys.length} keys matching: ${pattern}`);
                }
            } while (cursor !== "0");
        } catch (error) {
            console.error("[PostCache] Failed to invalidate by pattern:", error);
        }
    }
}
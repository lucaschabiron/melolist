import { Redis } from "ioredis";

let sharedClient: Redis | null = null;

export function getQueueRedis(): Redis {
    if (sharedClient) return sharedClient;
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    sharedClient = new Redis(url, { maxRetriesPerRequest: null });
    return sharedClient;
}

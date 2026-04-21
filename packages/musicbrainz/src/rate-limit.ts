import type { Redis } from "ioredis";

const SCRIPT = `
local key = KEYS[1]
local interval = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local next_avail = tonumber(redis.call('GET', key))
if next_avail == nil or next_avail <= now then
  redis.call('SET', key, now + interval, 'PX', 60000)
  return 0
else
  redis.call('SET', key, next_avail + interval, 'PX', 60000)
  return next_avail - now
end
`;

const KEY = "mb:ratelimit:next";
const INTERVAL_MS = 1000;

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function acquireMusicbrainzSlot(redis: Redis): Promise<void> {
    const waitMs = (await redis.eval(
        SCRIPT,
        1,
        KEY,
        INTERVAL_MS.toString(),
        Date.now().toString(),
    )) as number;
    if (waitMs > 0) await sleep(waitMs);
}

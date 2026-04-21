import { Worker } from "bullmq";
import {
    MUSICBRAINZ_QUEUE,
    getQueueRedis,
    type MusicbrainzJobData,
    type MusicbrainzJobName,
} from "@melolist/queue";
import { processFetchArtist } from "./processors/fetch-artist";
import { processFetchReleaseGroup } from "./processors/fetch-release-group";

const worker = new Worker<
    MusicbrainzJobData[MusicbrainzJobName],
    unknown,
    MusicbrainzJobName
>(
    MUSICBRAINZ_QUEUE,
    async (job) => {
        switch (job.name) {
            case "fetch-artist":
                return processFetchArtist(
                    job as Parameters<typeof processFetchArtist>[0],
                );
            case "fetch-release-group":
                return processFetchReleaseGroup(
                    job as Parameters<typeof processFetchReleaseGroup>[0],
                );
            default:
                throw new Error(`unknown job: ${job.name}`);
        }
    },
    {
        connection: getQueueRedis(),
        concurrency: 1,
    },
);

worker.on("ready", () => {
    console.log(`[worker] ready, queue=${MUSICBRAINZ_QUEUE}`);
});

worker.on("completed", (job) => {
    console.log(`[worker] ${job.name} ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(
        `[worker] ${job?.name} ${job?.id} failed (attempt ${job?.attemptsMade}):`,
        err.message,
    );
});

async function shutdown(signal: string) {
    console.log(`[worker] ${signal} received, closing...`);
    await worker.close();
    process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

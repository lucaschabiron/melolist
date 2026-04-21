import { Queue } from "bullmq";
import { getQueueRedis } from "./redis";

export const MUSICBRAINZ_QUEUE = "musicbrainz";

export type MusicbrainzJobName =
    | "fetch-artist"
    | "fetch-release-group"
    | "fetch-releases";

export type MusicbrainzJobData = {
    "fetch-artist": { mbid: string };
    "fetch-release-group": { mbid: string };
    "fetch-releases": { releaseGroupMbid: string };
};

export type MusicbrainzJobReturn = {
    "fetch-artist": { artistId: string };
    "fetch-release-group": { releaseGroupId: string };
    "fetch-releases": { count: number };
};

let queue: Queue | null = null;

export function getMusicbrainzQueue(): Queue {
    if (queue) return queue;
    queue = new Queue(MUSICBRAINZ_QUEUE, {
        connection: getQueueRedis(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: { age: 3600, count: 500 },
            removeOnFail: { age: 24 * 3600 },
        },
    });
    return queue;
}

function jobId(name: MusicbrainzJobName, mbid: string): string {
    return `${name}_${mbid}`;
}

export async function enqueueFetchArtist(mbid: string) {
    return getMusicbrainzQueue().add(
        "fetch-artist" satisfies MusicbrainzJobName,
        { mbid } satisfies MusicbrainzJobData["fetch-artist"],
        { jobId: jobId("fetch-artist", mbid) },
    );
}

export async function enqueueFetchReleaseGroup(mbid: string) {
    return getMusicbrainzQueue().add(
        "fetch-release-group" satisfies MusicbrainzJobName,
        { mbid } satisfies MusicbrainzJobData["fetch-release-group"],
        { jobId: jobId("fetch-release-group", mbid) },
    );
}

export async function enqueueFetchReleases(releaseGroupMbid: string) {
    return getMusicbrainzQueue().add(
        "fetch-releases" satisfies MusicbrainzJobName,
        {
            releaseGroupMbid,
        } satisfies MusicbrainzJobData["fetch-releases"],
        { jobId: jobId("fetch-releases", releaseGroupMbid) },
    );
}

export type JobStatusResponse = {
    id: string;
    name: MusicbrainzJobName;
    status:
        | "queued"
        | "active"
        | "delayed"
        | "completed"
        | "failed"
        | "unknown";
    attemptsMade: number;
    error?: string;
};

export async function getJobStatus(
    id: string,
): Promise<JobStatusResponse | null> {
    const q = getMusicbrainzQueue();
    const job = await q.getJob(id);
    if (!job) return null;
    const state = await job.getState();

    const map: Record<string, JobStatusResponse["status"]> = {
        waiting: "queued",
        "waiting-children": "queued",
        prioritized: "queued",
        active: "active",
        delayed: "delayed",
        completed: "completed",
        failed: "failed",
    };

    return {
        id: job.id!,
        name: job.name as MusicbrainzJobName,
        status: map[state] ?? "unknown",
        attemptsMade: job.attemptsMade,
        error: job.failedReason,
    };
}

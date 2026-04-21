import {
    and,
    db,
    eq,
    notInArray,
    musicbrainzFetchLog,
    release,
    releaseGroup,
} from "@melolist/db";
import { browseReleasesByReleaseGroup } from "@melolist/musicbrainz";
import type { Job } from "bullmq";
import type { MusicbrainzJobData } from "@melolist/queue";
import { mapReleaseStatus, parseDate } from "../mappers";

export async function processFetchReleases(
    job: Job<MusicbrainzJobData["fetch-releases"]>,
): Promise<{ count: number }> {
    const { releaseGroupMbid } = job.data;
    let releaseGroupId: string | null = null;

    try {
        const [rgRow] = await db
            .select({ id: releaseGroup.id })
            .from(releaseGroup)
            .where(eq(releaseGroup.musicbrainzId, releaseGroupMbid))
            .limit(1);

        if (!rgRow) {
            throw new Error(
                `release-group ${releaseGroupMbid} not seeded — cannot attach releases`,
            );
        }

        releaseGroupId = rgRow.id;

        await db
            .update(releaseGroup)
            .set({ releasesStatus: "seeding" })
            .where(eq(releaseGroup.id, rgRow.id));

        const releases = await browseReleasesByReleaseGroup(releaseGroupMbid);
        const fetchedReleaseIds = releases.map((r) => r.id);

        await db.transaction(async (tx) => {
            for (const r of releases) {
                const values = {
                    musicbrainzId: r.id,
                    releaseGroupId: rgRow.id,
                    title: r.title,
                    status: mapReleaseStatus(r.status),
                    releaseDate: parseDate(r.date),
                    country: r.country ?? null,
                    lastFetchedAt: new Date(),
                };

                await tx.insert(release).values(values).onConflictDoUpdate({
                    target: release.musicbrainzId,
                    set: values,
                });
            }

            if (fetchedReleaseIds.length === 0) {
                await tx
                    .delete(release)
                    .where(eq(release.releaseGroupId, rgRow.id));
            } else {
                await tx
                    .delete(release)
                    .where(
                        and(
                            eq(release.releaseGroupId, rgRow.id),
                            notInArray(
                                release.musicbrainzId,
                                fetchedReleaseIds,
                            ),
                        ),
                    );
            }

            await tx
                .update(releaseGroup)
                .set({
                    releasesStatus: "ready",
                    releasesFetchedAt: new Date(),
                })
                .where(eq(releaseGroup.id, rgRow.id));
        });

        await db.insert(musicbrainzFetchLog).values({
            entityType: "release_group",
            operation: "fetch_releases",
            musicbrainzId: releaseGroupMbid,
            status: "success",
        });

        return { count: releases.length };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        if (releaseGroupId) {
            await db
                .update(releaseGroup)
                .set({ releasesStatus: "failed" })
                .where(eq(releaseGroup.id, releaseGroupId));
        }

        await db.insert(musicbrainzFetchLog).values({
            entityType: "release_group",
            operation: "fetch_releases",
            musicbrainzId: releaseGroupMbid,
            status: "failure",
            error: message,
        });
        throw err;
    }
}

import {
    artist,
    db,
    eq,
    musicbrainzFetchLog,
    releaseGroup,
} from "@melolist/db";
import { coverArtUrl, getReleaseGroup } from "@melolist/musicbrainz";
import type { Job } from "bullmq";
import { enqueueFetchReleases, type MusicbrainzJobData } from "@melolist/queue";
import {
    isCanonicalAlbumReleaseGroup,
    joinArtistCredit,
    mapReleaseType,
    parseDate,
} from "../mappers";

async function upsertArtistStub(
    mbid: string,
    name: string,
    sortName: string | null,
    disambiguation: string | null,
): Promise<string> {
    const [inserted] = await db
        .insert(artist)
        .values({
            musicbrainzId: mbid,
            name,
            sortName,
            disambiguation,
        })
        .onConflictDoNothing({ target: artist.musicbrainzId })
        .returning({ id: artist.id });

    if (inserted) return inserted.id;

    const existing = await db
        .select({ id: artist.id })
        .from(artist)
        .where(eq(artist.musicbrainzId, mbid))
        .limit(1);
    return existing[0]!.id;
}

export async function processFetchReleaseGroup(
    job: Job<MusicbrainzJobData["fetch-release-group"]>,
): Promise<{ releaseGroupId: string }> {
    const { mbid } = job.data;

    try {
        const rg = await getReleaseGroup(mbid);
        const primaryCredit = rg["artist-credit"]?.[0];
        if (!primaryCredit) {
            throw new Error(
                `release-group ${mbid} has no artist-credit — cannot link`,
            );
        }

        const artistId = await upsertArtistStub(
            primaryCredit.artist.id,
            primaryCredit.artist.name,
            primaryCredit.artist["sort-name"] ?? null,
            primaryCredit.artist.disambiguation ?? null,
        );
        const mappedType = mapReleaseType(rg);
        const secondaryTypes = rg["secondary-types"] ?? [];
        const shouldSeedReleases = isCanonicalAlbumReleaseGroup(
            mappedType,
            secondaryTypes,
        );
        const [existing] = await db
            .select({
                releasesStatus: releaseGroup.releasesStatus,
                releasesFetchedAt: releaseGroup.releasesFetchedAt,
            })
            .from(releaseGroup)
            .where(eq(releaseGroup.musicbrainzId, mbid))
            .limit(1);
        const releasesStatus = shouldSeedReleases
            ? existing?.releasesStatus === "ready" ||
              existing?.releasesStatus === "seeding"
                ? existing.releasesStatus
                : ("pending" as const)
            : null;

        const rgValues = {
            musicbrainzId: rg.id,
            artistId,
            primaryArtistCredit: joinArtistCredit(
                rg["artist-credit"],
                primaryCredit.artist.name,
            ),
            title: rg.title,
            releaseType: mappedType,
            secondaryTypes,
            firstReleaseDate: parseDate(rg["first-release-date"]),
            coverArtUrl: coverArtUrl(rg.id),
            lastFetchedAt: new Date(),
            releasesStatus,
            releasesFetchedAt:
                releasesStatus === "ready"
                    ? (existing?.releasesFetchedAt ?? null)
                    : null,
        };

        const [row] = await db
            .insert(releaseGroup)
            .values(rgValues)
            .onConflictDoUpdate({
                target: releaseGroup.musicbrainzId,
                set: rgValues,
            })
            .returning({ id: releaseGroup.id });

        if (releasesStatus === "pending") {
            await enqueueFetchReleases(rg.id);
        }

        await db.insert(musicbrainzFetchLog).values({
            entityType: "release_group",
            operation: "fetch_release_group",
            musicbrainzId: mbid,
            status: "success",
        });

        return { releaseGroupId: row!.id };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.insert(musicbrainzFetchLog).values({
            entityType: "release_group",
            operation: "fetch_release_group",
            musicbrainzId: mbid,
            status: "failure",
            error: message,
        });
        throw err;
    }
}

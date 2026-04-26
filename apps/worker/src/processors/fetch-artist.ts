import {
    artist,
    db,
    eq,
    musicbrainzFetchLog,
    releaseGroup,
} from "@melolist/db";
import {
    browseReleaseGroupsByArtist,
    coverArtUrl,
    getArtist,
    resolveArtistImageUrl,
} from "@melolist/musicbrainz";
import type { Job } from "bullmq";
import { enqueueFetchReleases, type MusicbrainzJobData } from "@melolist/queue";
import {
    isCanonicalAlbumReleaseGroup,
    joinArtistCredit,
    mapReleaseType,
    parseDate,
    parseYear,
} from "../mappers";

export async function processFetchArtist(
    job: Job<MusicbrainzJobData["fetch-artist"]>,
): Promise<{ artistId: string }> {
    const { mbid } = job.data;
    let profileWritten = false;

    try {
        const mb = await getArtist(mbid);
        const imageUrl = await resolveArtistImageUrl(mb);

        const values = {
            musicbrainzId: mb.id,
            name: mb.name,
            sortName: mb["sort-name"] ?? null,
            disambiguation: mb.disambiguation ?? null,
            country: mb.country ?? null,
            imageUrl,
            foundedYear: parseYear(mb["life-span"]?.begin),
            dissolvedYear: parseYear(mb["life-span"]?.end),
            profileSeedStatus: "ready" as const,
            discographySeedStatus: "seeding" as const,
            lastFetchedAt: new Date(),
            discographyFetchedAt: null,
        };

        const [row] = await db
            .insert(artist)
            .values(values)
            .onConflictDoUpdate({
                target: artist.musicbrainzId,
                set: values,
            })
            .returning({ id: artist.id });

        const artistId = row!.id;
        profileWritten = true;

        const rgs = await browseReleaseGroupsByArtist(mbid);
        const releaseGroupMbidsToSeed: string[] = [];

        for (const rg of rgs) {
            const mappedType = mapReleaseType(rg);
            const secondaryTypes = rg["secondary-types"] ?? [];
            const shouldSeedReleases = isCanonicalAlbumReleaseGroup(
                mappedType,
                secondaryTypes,
            );

            const rgValues = {
                musicbrainzId: rg.id,
                artistId,
                primaryArtistCredit: joinArtistCredit(
                    rg["artist-credit"],
                    mb.name,
                ),
                title: rg.title,
                releaseType: mappedType,
                secondaryTypes,
                firstReleaseDate: parseDate(rg["first-release-date"]),
                coverArtUrl: coverArtUrl(rg.id),
                lastFetchedAt: new Date(),
                releasesStatus: shouldSeedReleases
                    ? ("pending" as const)
                    : null,
                releasesFetchedAt: null,
            };

            await db.insert(releaseGroup).values(rgValues).onConflictDoUpdate({
                target: releaseGroup.musicbrainzId,
                set: rgValues,
            });

            if (shouldSeedReleases) {
                releaseGroupMbidsToSeed.push(rg.id);
            }
        }

        await Promise.all(
            releaseGroupMbidsToSeed.map((releaseGroupMbid) =>
                enqueueFetchReleases(releaseGroupMbid),
            ),
        );

        await db
            .update(artist)
            .set({
                discographySeedStatus: "ready",
                discographyFetchedAt: new Date(),
            })
            .where(eq(artist.id, artistId));

        await db.insert(musicbrainzFetchLog).values({
            entityType: "artist",
            operation: "fetch_artist",
            musicbrainzId: mbid,
            status: "success",
        });

        return { artistId };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        await db
            .update(artist)
            .set(
                profileWritten
                    ? { discographySeedStatus: "failed" }
                    : {
                          profileSeedStatus: "failed",
                          discographySeedStatus: "failed",
                      },
            )
            .where(eq(artist.musicbrainzId, mbid));

        await db.insert(musicbrainzFetchLog).values({
            entityType: "artist",
            operation: "fetch_artist",
            musicbrainzId: mbid,
            status: "failure",
            error: message,
        });
        throw err;
    }
}

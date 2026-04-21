import {
    artist,
    db,
    musicbrainzFetchLog,
    releaseGroup,
} from "@melolist/db";
import {
    browseReleaseGroupsByArtist,
    coverArtUrl,
    getArtist,
} from "@melolist/musicbrainz";
import type { Job } from "bullmq";
import type { MusicbrainzJobData } from "@melolist/queue";
import {
    joinArtistCredit,
    mapReleaseType,
    parseDate,
    parseYear,
} from "../mappers";

export async function processFetchArtist(
    job: Job<MusicbrainzJobData["fetch-artist"]>,
): Promise<{ artistId: string }> {
    const { mbid } = job.data;

    try {
        const mb = await getArtist(mbid);

        const values = {
            musicbrainzId: mb.id,
            name: mb.name,
            sortName: mb["sort-name"] ?? null,
            disambiguation: mb.disambiguation ?? null,
            country: mb.country ?? null,
            foundedYear: parseYear(mb["life-span"]?.begin),
            dissolvedYear: parseYear(mb["life-span"]?.end),
            lastFetchedAt: new Date(),
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

        const rgs = await browseReleaseGroupsByArtist(mbid);

        for (const rg of rgs) {
            const rgValues = {
                musicbrainzId: rg.id,
                artistId,
                primaryArtistCredit: joinArtistCredit(
                    rg["artist-credit"],
                    mb.name,
                ),
                title: rg.title,
                releaseType: mapReleaseType(rg),
                secondaryTypes: rg["secondary-types"] ?? [],
                firstReleaseDate: parseDate(rg["first-release-date"]),
                coverArtUrl: coverArtUrl(rg.id),
                lastFetchedAt: new Date(),
            };

            await db
                .insert(releaseGroup)
                .values(rgValues)
                .onConflictDoUpdate({
                    target: releaseGroup.musicbrainzId,
                    set: rgValues,
                });
        }

        await db.insert(musicbrainzFetchLog).values({
            entityType: "artist",
            musicbrainzId: mbid,
            status: "success",
        });

        return { artistId };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.insert(musicbrainzFetchLog).values({
            entityType: "artist",
            musicbrainzId: mbid,
            status: "failure",
            error: message,
        });
        throw err;
    }
}

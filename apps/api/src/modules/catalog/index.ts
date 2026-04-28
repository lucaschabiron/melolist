import { Elysia, t } from "elysia";
import {
    db,
    artist,
    releaseGroup,
    release,
    releaseMedium,
    releaseTrack,
    eq,
    and,
    asc,
    inArray,
    sql,
} from "@melolist/db";
import {
    enqueueFetchArtist,
    enqueueFetchReleaseGroup,
    enqueueFetchReleases,
    enqueueRefreshArtist,
    enqueueRefreshReleases,
    getJobStatus,
} from "@melolist/queue";
import { authPlugin } from "../../lib/auth-plugin";
import { searchCatalog, searchCatalogReleaseGroups } from "./search";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ARTIST_DISCOGRAPHY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function pollUrl(jobId: string): string {
    return `/catalog/jobs/${jobId}`;
}

type ReleaseRow = typeof release.$inferSelect;

function isOlderThan(date: Date | null, ttlMs: number) {
    if (!date) return true;
    return Date.now() - date.getTime() > ttlMs;
}

function sortReleaseCandidates(a: ReleaseRow, b: ReleaseRow) {
    const officialDelta =
        Number(b.status === "official") - Number(a.status === "official");
    if (officialDelta !== 0) return officialDelta;

    const aDate = a.releaseDate ?? "9999-99-99";
    const bDate = b.releaseDate ?? "9999-99-99";
    const dateDelta = aDate.localeCompare(bDate);
    if (dateDelta !== 0) return dateDelta;

    return a.title.localeCompare(b.title);
}

async function selectedReleaseTracklist(releaseGroupId: string) {
    const releases = await releaseEditions(releaseGroupId);

    const candidates = releases.sort(sortReleaseCandidates);
    if (candidates.length === 0) return null;

    let fallback: {
        release: ReleaseRow;
        media: Array<
            typeof releaseMedium.$inferSelect & {
                tracks: (typeof releaseTrack.$inferSelect)[];
            }
        >;
    } | null = null;

    for (const candidate of candidates) {
        const tracklist = await releaseTracklist(candidate);
        const hasTracks = tracklist.media.some(
            (medium) => medium.tracks.length > 0,
        );
        if (hasTracks) return tracklist;
        fallback ??= tracklist;
    }

    return fallback;
}

async function releaseEditions(releaseGroupId: string) {
    const releases = await db
        .select()
        .from(release)
        .where(eq(release.releaseGroupId, releaseGroupId));

    return releases.sort(sortReleaseCandidates);
}

async function releaseTracklist(selected: ReleaseRow) {
    const mediaRows = await db
        .select()
        .from(releaseMedium)
        .where(eq(releaseMedium.releaseId, selected.id))
        .orderBy(asc(releaseMedium.position));

    if (mediaRows.length === 0) {
        return {
            release: selected,
            media: [],
        };
    }

    const tracks = await db
        .select()
        .from(releaseTrack)
        .where(
            inArray(
                releaseTrack.mediumId,
                mediaRows.map((m) => m.id),
            ),
        )
        .orderBy(asc(releaseTrack.position));

    const tracksByMedium = new Map<string, typeof tracks>();
    for (const track of tracks) {
        const list = tracksByMedium.get(track.mediumId) ?? [];
        list.push(track);
        tracksByMedium.set(track.mediumId, list);
    }

    return {
        release: selected,
        media: mediaRows.map((medium) => ({
            ...medium,
            tracks: tracksByMedium.get(medium.id) ?? [],
        })),
    };
}

function tracklistHasTracks(
    tracklist: Awaited<ReturnType<typeof selectedReleaseTracklist>>,
) {
    return tracklist?.media.some((medium) => medium.tracks.length > 0) ?? false;
}

function serializeReleaseGroup(row: {
    musicbrainzId: string | null;
    title: string;
    primaryArtistCredit: string;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
    artistMbid?: string | null;
}) {
    return {
        mbid: row.musicbrainzId,
        title: row.title,
        primaryArtistCredit: row.primaryArtistCredit,
        artistMbid: row.artistMbid ?? null,
        year: row.firstReleaseDate
            ? Number(row.firstReleaseDate.slice(0, 4))
            : null,
        coverArtUrl: row.coverArtUrl,
    };
}

export const catalogController = new Elysia({
    name: "catalog",
    prefix: "/catalog",
})
    .use(authPlugin)

    .get(
        "/artists/:mbid",
        async ({ params: { mbid }, status }) => {
            if (!UUID_RE.test(mbid))
                return status(400, { error: "invalid mbid" });

            const [row] = await db
                .select()
                .from(artist)
                .where(eq(artist.musicbrainzId, mbid))
                .limit(1);

            if (row && row.profileSeedStatus === "ready") {
                return { artist: row };
            }

            const job = await enqueueFetchArtist(mbid);
            return status(202, {
                jobId: job.id!,
                pollUrl: pollUrl(job.id!),
            });
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
        },
    )

    .get(
        "/artists/:mbid/release-groups",
        async ({ params: { mbid }, query, status }) => {
            if (!UUID_RE.test(mbid))
                return status(400, { error: "invalid mbid" });

            const [artistRow] = await db
                .select()
                .from(artist)
                .where(eq(artist.musicbrainzId, mbid))
                .limit(1);

            if (!artistRow || artistRow.discographySeedStatus !== "ready") {
                const job = await enqueueFetchArtist(mbid);
                return status(202, {
                    jobId: job.id!,
                    pollUrl: pollUrl(job.id!),
                });
            }

            const discographyIsStale = isOlderThan(
                artistRow.discographyFetchedAt,
                ARTIST_DISCOGRAPHY_TTL_MS,
            );
            if (discographyIsStale) {
                await enqueueRefreshArtist(mbid);
            }

            const filters = [eq(releaseGroup.artistId, artistRow.id)];
            if (query.canonical === "true") {
                filters.push(eq(releaseGroup.releaseType, "album"));
                filters.push(
                    sql`(${releaseGroup.secondaryTypes} IS NULL OR cardinality(${releaseGroup.secondaryTypes}) = 0)`,
                );

                const candidateReleaseGroups = await db
                    .select({
                        musicbrainzId: releaseGroup.musicbrainzId,
                        releasesStatus: releaseGroup.releasesStatus,
                    })
                    .from(releaseGroup)
                    .where(and(...filters));

                const pendingReleaseGroups = candidateReleaseGroups.filter(
                    (rg) => rg.releasesStatus !== "ready",
                );

                await Promise.all(
                    pendingReleaseGroups
                        .filter(
                            (rg) =>
                                rg.releasesStatus !== "seeding" &&
                                rg.musicbrainzId !== null,
                        )
                        .map((rg) =>
                            rg.releasesStatus === "pending"
                                ? enqueueRefreshReleases(rg.musicbrainzId!)
                                : enqueueFetchReleases(rg.musicbrainzId!),
                        ),
                );

                if (pendingReleaseGroups.length > 0) {
                    return status(202, {
                        pendingReleaseGroupCount: pendingReleaseGroups.length,
                        pollUrl: `/catalog/artists/${mbid}/release-groups?canonical=true`,
                    });
                }

                filters.push(
                    sql`EXISTS (SELECT 1 FROM ${release} r WHERE r.release_group_id = ${releaseGroup.id} AND r.status = 'official')`,
                );
            } else if (query.type) {
                filters.push(
                    eq(
                        releaseGroup.releaseType,
                        query.type as (typeof releaseGroup.releaseType.enumValues)[number],
                    ),
                );
            }

            const rgs = await db
                .select()
                .from(releaseGroup)
                .where(and(...filters));

            return {
                artist: artistRow,
                releaseGroups: rgs,
                discographyStatus: discographyIsStale
                    ? "refreshing"
                    : artistRow.discographySeedStatus,
            };
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
            query: t.Object({
                canonical: t.Optional(t.String()),
                type: t.Optional(t.String()),
            }),
        },
    )

    .get(
        "/recordings/:mbid",
        async ({ params: { mbid }, status }) => {
            if (!UUID_RE.test(mbid))
                return status(400, { error: "invalid mbid" });

            const rows = await db
                .select({
                    trackId: releaseTrack.id,
                    recordingMbid: releaseTrack.recordingMbid,
                    trackTitle: releaseTrack.title,
                    trackNumber: releaseTrack.number,
                    trackPosition: releaseTrack.position,
                    lengthMs: releaseTrack.lengthMs,
                    mediumPosition: releaseMedium.position,
                    mediumTitle: releaseMedium.title,
                    mediumFormat: releaseMedium.format,
                    release: {
                        mbid: release.musicbrainzId,
                        title: release.title,
                        status: release.status,
                        releaseDate: release.releaseDate,
                        country: release.country,
                    },
                    artistMbid: artist.musicbrainzId,
                    releaseGroup,
                })
                .from(releaseTrack)
                .innerJoin(
                    releaseMedium,
                    eq(releaseTrack.mediumId, releaseMedium.id),
                )
                .innerJoin(release, eq(releaseMedium.releaseId, release.id))
                .innerJoin(
                    releaseGroup,
                    eq(release.releaseGroupId, releaseGroup.id),
                )
                .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
                .where(eq(releaseTrack.recordingMbid, mbid))
                .orderBy(
                    asc(release.releaseDate),
                    asc(releaseMedium.position),
                    asc(releaseTrack.position),
                );

            if (rows.length === 0)
                return status(404, { error: "recording not found" });

            const first = rows[0]!;
            return {
                recording: {
                    mbid,
                    title: first.trackTitle,
                    primaryArtistCredit: first.releaseGroup.primaryArtistCredit,
                    lengthMs: first.lengthMs,
                },
                appearances: rows.map((row) => ({
                    trackId: row.trackId,
                    title: row.trackTitle,
                    number: row.trackNumber,
                    position: row.trackPosition,
                    lengthMs: row.lengthMs,
                    medium: {
                        position: row.mediumPosition,
                        title: row.mediumTitle,
                        format: row.mediumFormat,
                    },
                    release: row.release,
                    releaseGroup: serializeReleaseGroup({
                        ...row.releaseGroup,
                        artistMbid: row.artistMbid,
                    }),
                })),
            };
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
        },
    )

    .get(
        "/release-groups/:mbid",
        async ({ params: { mbid }, status }) => {
            if (!UUID_RE.test(mbid))
                return status(400, { error: "invalid mbid" });

            const [rg] = await db
                .select()
                .from(releaseGroup)
                .where(eq(releaseGroup.musicbrainzId, mbid))
                .limit(1);

            if (rg && rg.lastFetchedAt) {
                const [artistRow] = await db
                    .select()
                    .from(artist)
                    .where(eq(artist.id, rg.artistId))
                    .limit(1);

                if (
                    rg.releasesStatus !== "ready" &&
                    rg.releasesStatus !== "seeding"
                ) {
                    await enqueueFetchReleases(mbid);
                }

                const editions =
                    rg.releasesStatus === "ready"
                        ? await releaseEditions(rg.id)
                        : [];
                let tracksStatus = rg.releasesStatus ?? "pending";
                let tracklist =
                    rg.releasesStatus === "ready"
                        ? await selectedReleaseTracklist(rg.id)
                        : null;

                if (
                    rg.releasesStatus === "ready" &&
                    editions.length > 0 &&
                    !tracklistHasTracks(tracklist)
                ) {
                    await enqueueRefreshReleases(mbid);
                    tracksStatus = "seeding";
                    tracklist = null;
                }

                return {
                    releaseGroup: rg,
                    artist: artistRow ?? null,
                    tracksStatus,
                    selectedRelease: tracklist?.release ?? null,
                    media: tracklist?.media ?? [],
                    editions,
                };
            }

            const job = await enqueueFetchReleaseGroup(mbid);
            return status(202, {
                jobId: job.id!,
                pollUrl: pollUrl(job.id!),
            });
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
        },
    )

    .get(
        "/search",
        async ({ query, status }) => {
            const q = query.q.trim();
            if (q.length < 2) return status(400, { error: "query too short" });
            return searchCatalog(q);
        },
        {
            auth: true,
            query: t.Object({
                q: t.String({ minLength: 2 }),
            }),
        },
    )

    .get(
        "/search/release-groups",
        async ({ query, status }) => {
            const q = query.q.trim();
            if (q.length < 2) return status(400, { error: "query too short" });
            return searchCatalogReleaseGroups(q);
        },
        {
            auth: true,
            query: t.Object({
                q: t.String({ minLength: 2 }),
            }),
        },
    )

    .get(
        "/jobs/:id",
        async ({ params: { id }, status }) => {
            const job = await getJobStatus(id);
            if (!job) return status(404, { error: "job not found" });
            return job;
        },
        {
            auth: true,
            params: t.Object({ id: t.String() }),
        },
    );

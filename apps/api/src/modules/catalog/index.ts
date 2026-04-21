import { Elysia, t } from "elysia";
import { db, artist, releaseGroup, release, eq, and, sql } from "@melolist/db";
import {
    enqueueFetchArtist,
    enqueueFetchReleaseGroup,
    enqueueFetchReleases,
    getJobStatus,
} from "@melolist/queue";
import { authPlugin } from "../../lib/auth-plugin";
import { searchCatalog } from "./search";
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pollUrl(jobId: string): string {
    return `/catalog/jobs/${jobId}`;
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
                        .map((rg) => enqueueFetchReleases(rg.musicbrainzId!)),
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

            return { artist: artistRow, releaseGroups: rgs };
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
                return { releaseGroup: rg, artist: artistRow ?? null };
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

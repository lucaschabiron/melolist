import { artist, asc, db, desc, eq, releaseGroup, sql } from "@melolist/db";
import {
    dedupeAndLimitByMbid,
    type CatalogSearchArtistResult,
    type CatalogSearchReleaseGroupResult,
    type CatalogSearchResponse,
    mapMusicbrainzArtistSearch,
    mapMusicbrainzReleaseGroupSearch,
    normalizeSearchQuery,
    SEARCH_SECTION_LIMIT,
    shouldUseRemoteFallback,
} from "@melolist/musicbrainz";
import {
    getRedis,
    searchArtists,
    searchReleaseGroups,
} from "@melolist/musicbrainz";

const SEARCH_CACHE_TTL_SECONDS = 3600;

function exactMatchBoost(
    expression: ReturnType<typeof sql>,
    normalizedQuery: string,
) {
    return sql<number>`
        CASE
            WHEN ${expression} = ${normalizedQuery} THEN 1.0
            WHEN ${expression} LIKE ${`${normalizedQuery}%`} THEN 0.8
            WHEN ${expression} LIKE ${`%${normalizedQuery}%`} THEN 0.45
            ELSE 0
        END
    `;
}

function searchMatchFilter(
    expression: ReturnType<typeof sql>,
    normalizedQuery: string,
) {
    return sql<boolean>`
        ${expression} LIKE ${`%${normalizedQuery}%`}
        OR ${expression} % ${normalizedQuery}
        OR word_similarity(${expression}, ${normalizedQuery}) >= 0.45
    `;
}

async function searchLocalArtists(
    normalizedQuery: string,
): Promise<CatalogSearchArtistResult[]> {
    const artistName = sql<string>`immutable_unaccent(lower(${artist.name}))`;
    const artistSortName = sql<string>`immutable_unaccent(lower(coalesce(${artist.sortName}, '')))`;

    const searchScore = sql<number>`
        GREATEST(
            ${exactMatchBoost(artistName, normalizedQuery)},
            similarity(${artistName}, ${normalizedQuery}),
            word_similarity(${artistName}, ${normalizedQuery}),
            similarity(${artistSortName}, ${normalizedQuery}) * 0.75,
            word_similarity(${artistSortName}, ${normalizedQuery}) * 0.6
        ) + CASE
            WHEN ${artist.profileSeedStatus} = 'ready' THEN 0.05
            ELSE 0
        END
    `.as("search_score");

    const rows = await db
        .select({
            id: artist.id,
            mbid: artist.musicbrainzId,
            name: artist.name,
            sortName: artist.sortName,
            disambiguation: artist.disambiguation,
            country: artist.country,
            seeded: sql<boolean>`${artist.profileSeedStatus} = 'ready'`,
            searchScore,
        })
        .from(artist)
        .where(
            sql<boolean>`
                ${artist.musicbrainzId} IS NOT NULL
                AND (
                    ${searchMatchFilter(artistName, normalizedQuery)}
                    OR ${searchMatchFilter(artistSortName, normalizedQuery)}
                )
            `,
        )
        .orderBy(desc(searchScore), asc(artist.name))
        .limit(SEARCH_SECTION_LIMIT);

    return rows.map((row) => ({
        id: row.id,
        mbid: row.mbid!,
        name: row.name,
        sortName: row.sortName ?? null,
        disambiguation: row.disambiguation ?? null,
        country: row.country ?? null,
        source: "local",
        seeded: row.seeded,
    }));
}

async function searchLocalReleaseGroups(
    normalizedQuery: string,
): Promise<CatalogSearchReleaseGroupResult[]> {
    const releaseGroupTitle = sql<string>`immutable_unaccent(lower(${releaseGroup.title}))`;
    const releaseGroupArtistCredit = sql<string>`immutable_unaccent(lower(${releaseGroup.primaryArtistCredit}))`;
    const artistName = sql<string>`immutable_unaccent(lower(${artist.name}))`;

    const searchScore = sql<number>`
        GREATEST(
            ${exactMatchBoost(releaseGroupTitle, normalizedQuery)},
            similarity(${releaseGroupTitle}, ${normalizedQuery}),
            word_similarity(${releaseGroupTitle}, ${normalizedQuery}),
            similarity(${releaseGroupArtistCredit}, ${normalizedQuery}) * 0.8,
            word_similarity(${releaseGroupArtistCredit}, ${normalizedQuery}) * 0.7,
            similarity(${artistName}, ${normalizedQuery}) * 0.65,
            word_similarity(${artistName}, ${normalizedQuery}) * 0.55
        ) + CASE
            WHEN ${releaseGroup.lastFetchedAt} IS NOT NULL THEN 0.05
            ELSE 0
        END
    `.as("search_score");

    const rows = await db
        .select({
            id: releaseGroup.id,
            mbid: releaseGroup.musicbrainzId,
            title: releaseGroup.title,
            artistCredit: releaseGroup.primaryArtistCredit,
            releaseType: releaseGroup.releaseType,
            secondaryTypes: releaseGroup.secondaryTypes,
            firstReleaseDate: releaseGroup.firstReleaseDate,
            coverArtUrl: releaseGroup.coverArtUrl,
            seeded: sql<boolean>`${releaseGroup.lastFetchedAt} IS NOT NULL`,
            artistMbid: artist.musicbrainzId,
            artistName: artist.name,
            searchScore,
        })
        .from(releaseGroup)
        .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
        .where(
            sql<boolean>`
                ${releaseGroup.musicbrainzId} IS NOT NULL
                AND (
                    ${searchMatchFilter(releaseGroupTitle, normalizedQuery)}
                    OR ${searchMatchFilter(releaseGroupArtistCredit, normalizedQuery)}
                    OR ${searchMatchFilter(artistName, normalizedQuery)}
                )
            `,
        )
        .orderBy(desc(searchScore), asc(releaseGroup.title))
        .limit(SEARCH_SECTION_LIMIT);

    return rows.map((row) => ({
        id: row.id,
        mbid: row.mbid!,
        title: row.title,
        artistCredit: row.artistCredit,
        artist: {
            mbid: row.artistMbid,
            name: row.artistName,
        },
        releaseType: row.releaseType,
        secondaryTypes: row.secondaryTypes ?? [],
        firstReleaseDate: row.firstReleaseDate,
        coverArtUrl: row.coverArtUrl ?? null,
        source: "local",
        seeded: row.seeded,
    }));
}

async function getCachedRemoteArtists(
    query: string,
    normalizedQuery: string,
): Promise<CatalogSearchArtistResult[]> {
    const redis = getRedis();
    const cacheKey = `mb:search:v2:artists:${SEARCH_SECTION_LIMIT}:${normalizedQuery}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
        return JSON.parse(cached) as CatalogSearchArtistResult[];
    }

    const results = mapMusicbrainzArtistSearch(
        await searchArtists(query, SEARCH_SECTION_LIMIT),
    );

    await redis.set(
        cacheKey,
        JSON.stringify(results),
        "EX",
        SEARCH_CACHE_TTL_SECONDS,
    );
    return results;
}

async function getCachedRemoteReleaseGroups(
    query: string,
    normalizedQuery: string,
): Promise<CatalogSearchReleaseGroupResult[]> {
    const redis = getRedis();
    const cacheKey = `mb:search:v2:release-groups:${SEARCH_SECTION_LIMIT}:${normalizedQuery}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
        return JSON.parse(cached) as CatalogSearchReleaseGroupResult[];
    }

    const results = mapMusicbrainzReleaseGroupSearch(
        await searchReleaseGroups(query, SEARCH_SECTION_LIMIT),
    );

    await redis.set(
        cacheKey,
        JSON.stringify(results),
        "EX",
        SEARCH_CACHE_TTL_SECONDS,
    );
    return results;
}

export async function searchCatalog(
    query: string,
): Promise<CatalogSearchResponse> {
    const trimmedQuery = query.trim();
    const normalizedQuery = normalizeSearchQuery(trimmedQuery);

    const [localArtists, localReleaseGroups] = await Promise.all([
        searchLocalArtists(normalizedQuery),
        searchLocalReleaseGroups(normalizedQuery),
    ]);

    const [remoteArtists, remoteReleaseGroups] = await Promise.all([
        shouldUseRemoteFallback(localArtists.length)
            ? getCachedRemoteArtists(trimmedQuery, normalizedQuery)
            : Promise.resolve([]),
        shouldUseRemoteFallback(localReleaseGroups.length)
            ? getCachedRemoteReleaseGroups(trimmedQuery, normalizedQuery)
            : Promise.resolve([]),
    ]);

    const artists = dedupeAndLimitByMbid(localArtists, remoteArtists);
    const releaseGroups = dedupeAndLimitByMbid(
        localReleaseGroups,
        remoteReleaseGroups,
    );

    return {
        query: trimmedQuery,
        artists,
        releaseGroups,
        meta: {
            artists: {
                localCount: localArtists.length,
                returnedCount: artists.length,
                usedRemoteFallback: remoteArtists.length > 0,
            },
            releaseGroups: {
                localCount: localReleaseGroups.length,
                returnedCount: releaseGroups.length,
                usedRemoteFallback: remoteReleaseGroups.length > 0,
            },
        },
    };
}

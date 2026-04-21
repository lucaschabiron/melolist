import type {
    MbArtistCredit,
    MbArtistSearchResult,
    MbReleaseGroup,
    MbReleaseGroupSearchResult,
} from "./types";

export type SearchResultSource = "local" | "musicbrainz";

export type CatalogSearchArtistResult = {
    id: string | null;
    mbid: string;
    name: string;
    sortName: string | null;
    disambiguation: string | null;
    country: string | null;
    source: SearchResultSource;
    seeded: boolean;
};

export type CatalogSearchReleaseGroupResult = {
    id: string | null;
    mbid: string;
    title: string;
    artistCredit: string;
    artist: {
        mbid: string | null;
        name: string;
    } | null;
    releaseType: ReleaseTypeValue;
    secondaryTypes: string[];
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
    source: SearchResultSource;
    seeded: boolean;
};

export type CatalogSearchSectionMeta = {
    localCount: number;
    returnedCount: number;
    usedRemoteFallback: boolean;
};

export type CatalogSearchResponse = {
    query: string;
    artists: CatalogSearchArtistResult[];
    releaseGroups: CatalogSearchReleaseGroupResult[];
    meta: {
        artists: CatalogSearchSectionMeta;
        releaseGroups: CatalogSearchSectionMeta;
    };
};

export type ReleaseTypeValue =
    | "album"
    | "ep"
    | "single"
    | "live"
    | "compilation"
    | "mixtape"
    | "soundtrack"
    | "other";

export const SEARCH_SECTION_LIMIT = 8;
export const SEARCH_REMOTE_FALLBACK_THRESHOLD = 5;

export function normalizeSearchQuery(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function shouldUseRemoteFallback(localCount: number): boolean {
    return localCount < SEARCH_REMOTE_FALLBACK_THRESHOLD;
}

export function dedupeAndLimitByMbid<
    T extends { mbid: string; source: SearchResultSource },
>(localResults: T[], remoteResults: T[], limit = SEARCH_SECTION_LIMIT): T[] {
    const results: T[] = [];
    const seenMbids = new Set<string>();

    for (const result of [...localResults, ...remoteResults]) {
        if (seenMbids.has(result.mbid)) continue;
        seenMbids.add(result.mbid);
        results.push(result);
        if (results.length === limit) break;
    }

    return results;
}

export function joinArtistCredit(
    credits: MbArtistCredit[] | undefined,
    fallback: string,
): string {
    if (!credits || credits.length === 0) return fallback;
    return credits
        .map((credit) => `${credit.name}${credit.joinphrase ?? ""}`)
        .join("")
        .trim();
}

export function mapReleaseType(releaseGroup: MbReleaseGroup): ReleaseTypeValue {
    const secondaryTypes = releaseGroup["secondary-types"] ?? [];
    if (secondaryTypes.includes("Live")) return "live";
    if (secondaryTypes.includes("Compilation")) return "compilation";
    if (secondaryTypes.includes("Soundtrack")) return "soundtrack";
    if (secondaryTypes.includes("Mixtape/Street")) return "mixtape";

    switch (releaseGroup["primary-type"]) {
        case "Album":
            return "album";
        case "EP":
            return "ep";
        case "Single":
            return "single";
        default:
            return "other";
    }
}

export function mapMusicbrainzArtistSearch(
    searchResult: MbArtistSearchResult,
): CatalogSearchArtistResult[] {
    return searchResult.artists.map((artist) => ({
        id: null,
        mbid: artist.id,
        name: artist.name,
        sortName: artist["sort-name"] ?? null,
        disambiguation: artist.disambiguation ?? null,
        country: artist.country ?? null,
        source: "musicbrainz",
        seeded: false,
    }));
}

export function mapMusicbrainzReleaseGroupSearch(
    searchResult: MbReleaseGroupSearchResult,
): CatalogSearchReleaseGroupResult[] {
    return searchResult["release-groups"].map((releaseGroup) => {
        const primaryArtist = releaseGroup["artist-credit"]?.[0]?.artist;
        return {
            id: null,
            mbid: releaseGroup.id,
            title: releaseGroup.title,
            artistCredit: joinArtistCredit(
                releaseGroup["artist-credit"],
                "Unknown artist",
            ),
            artist: primaryArtist
                ? {
                      mbid: primaryArtist.id,
                      name: primaryArtist.name,
                  }
                : null,
            releaseType: mapReleaseType(releaseGroup),
            secondaryTypes: releaseGroup["secondary-types"] ?? [],
            firstReleaseDate: releaseGroup["first-release-date"] ?? null,
            coverArtUrl: null,
            source: "musicbrainz",
            seeded: false,
        };
    });
}

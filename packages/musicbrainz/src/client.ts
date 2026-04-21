import { getRedis } from "./redis";
import { acquireMusicbrainzSlot } from "./rate-limit";
import type {
    MbArtist,
    MbArtistSearchResult,
    MbBrowseReleaseGroups,
    MbBrowseReleases,
    MbRelease,
    MbReleaseGroup,
} from "./types";

const BASE_URL = "https://musicbrainz.org/ws/2";

export class MusicbrainzError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly url: string,
    ) {
        super(message);
    }
}

async function mbFetch<T>(path: string): Promise<T> {
    const userAgent = process.env.MUSICBRAINZ_USER_AGENT;
    if (!userAgent) throw new Error("MUSICBRAINZ_USER_AGENT is not set");

    await acquireMusicbrainzSlot(getRedis());

    const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}fmt=json`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": userAgent,
            Accept: "application/json",
        },
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new MusicbrainzError(
            `MusicBrainz ${res.status}: ${body.slice(0, 200)}`,
            res.status,
            url,
        );
    }

    return (await res.json()) as T;
}

export function getArtist(mbid: string): Promise<MbArtist> {
    return mbFetch<MbArtist>(`/artist/${mbid}`);
}

export function getReleaseGroup(mbid: string): Promise<MbReleaseGroup> {
    return mbFetch<MbReleaseGroup>(
        `/release-group/${mbid}?inc=artist-credits`,
    );
}

export async function browseReleaseGroupsByArtist(
    artistMbid: string,
): Promise<MbReleaseGroup[]> {
    const all: MbReleaseGroup[] = [];
    const limit = 100;
    let offset = 0;

    while (true) {
        const page = await mbFetch<MbBrowseReleaseGroups>(
            `/release-group?artist=${artistMbid}&limit=${limit}&offset=${offset}&inc=artist-credits`,
        );
        all.push(...page["release-groups"]);
        offset += page["release-groups"].length;
        if (offset >= page["release-group-count"]) break;
        if (page["release-groups"].length === 0) break;
    }

    return all;
}

export function searchArtists(
    query: string,
    limit = 25,
): Promise<MbArtistSearchResult> {
    const q = encodeURIComponent(query);
    return mbFetch<MbArtistSearchResult>(`/artist?query=${q}&limit=${limit}`);
}

export async function browseReleasesByReleaseGroup(
    releaseGroupMbid: string,
): Promise<MbRelease[]> {
    const all: MbRelease[] = [];
    const limit = 100;
    let offset = 0;

    while (true) {
        const page = await mbFetch<MbBrowseReleases>(
            `/release?release-group=${releaseGroupMbid}&limit=${limit}&offset=${offset}`,
        );
        all.push(...page.releases);
        offset += page.releases.length;
        if (offset >= page["release-count"]) break;
        if (page.releases.length === 0) break;
    }

    return all;
}

export function coverArtUrl(releaseGroupMbid: string): string {
    return `https://coverartarchive.org/release-group/${releaseGroupMbid}/front`;
}

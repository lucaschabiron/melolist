import { cookies } from "next/headers";
import { apiBaseUrl } from "../../../../lib/config";
import AlbumView, { type AlbumHeaderData } from "./album-view";

type ReleaseGroupRow = {
    id: string;
    musicbrainzId: string;
    title: string;
    primaryArtistCredit: string;
    releaseType:
        | "album"
        | "ep"
        | "single"
        | "live"
        | "compilation"
        | "mixtape"
        | "soundtrack"
        | "other";
    secondaryTypes: string[] | null;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
};

type ArtistRow = {
    musicbrainzId: string;
    name: string;
} | null;

type ReleaseGroupResponse = {
    releaseGroup: ReleaseGroupRow;
    artist: ArtistRow;
};

type ReleaseGroupDetailPageProps = {
    params: Promise<{
        mbid: string;
    }>;
};

function prettyReleaseType(value: ReleaseGroupRow["releaseType"]) {
    if (value === "ep") return "EP";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

async function fetchReleaseGroup(
    mbid: string,
): Promise<ReleaseGroupResponse | null> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
        new URL(`catalog/release-groups/${mbid}`, apiBaseUrl),
        {
            headers: cookieHeader ? { cookie: cookieHeader } : undefined,
            cache: "no-store",
        },
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as
        | ReleaseGroupResponse
        | { jobId: string; pollUrl: string };

    if ("jobId" in payload) return null;
    return payload;
}

export default async function ReleaseGroupDetailPage({
    params,
}: ReleaseGroupDetailPageProps) {
    const { mbid } = await params;

    let header: AlbumHeaderData | null = null;
    let pending = false;

    try {
        const data = await fetchReleaseGroup(mbid);
        if (data) {
            const { releaseGroup, artist } = data;
            header = {
                title: releaseGroup.title,
                artist: releaseGroup.primaryArtistCredit,
                artistMbid: artist?.musicbrainzId ?? null,
                year: releaseGroup.firstReleaseDate
                    ? Number(releaseGroup.firstReleaseDate.slice(0, 4))
                    : null,
                type: prettyReleaseType(releaseGroup.releaseType),
                secondaryTypes: releaseGroup.secondaryTypes ?? [],
                coverArtUrl: releaseGroup.coverArtUrl,
            };
        } else {
            pending = true;
        }
    } catch {
        pending = true;
    }

    return <AlbumView header={header} pending={pending} />;
}

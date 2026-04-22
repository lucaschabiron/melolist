import { cookies } from "next/headers";
import { apiBaseUrl } from "../../../../lib/config";
import ArtistView, {
    type ArtistProfile,
    type DiscographyReleaseGroup,
} from "./artist-view";

type ArtistRow = {
    musicbrainzId: string;
    name: string;
    sortName: string | null;
    disambiguation: string | null;
    country: string | null;
    foundedYear: number | null;
    dissolvedYear: number | null;
};

type ReleaseGroupRow = {
    musicbrainzId: string;
    title: string;
    releaseType: DiscographyReleaseGroup["releaseType"];
    secondaryTypes: string[] | null;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
};

function toProfile(row: ArtistRow): ArtistProfile {
    return {
        mbid: row.musicbrainzId,
        name: row.name,
        disambiguation: row.disambiguation,
        country: row.country,
        foundedYear: row.foundedYear,
        dissolvedYear: row.dissolvedYear,
        imageUrl: null,
    };
}

function toDiscographyItem(row: ReleaseGroupRow): DiscographyReleaseGroup {
    return {
        mbid: row.musicbrainzId,
        title: row.title,
        releaseType: row.releaseType,
        secondaryTypes: row.secondaryTypes ?? [],
        firstReleaseDate: row.firstReleaseDate,
    };
}

async function apiFetch(path: string, cookieHeader: string) {
    return fetch(new URL(path, apiBaseUrl), {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: "no-store",
    });
}

export default async function ArtistDetailPage({
    params,
}: {
    params: Promise<{ mbid: string }>;
}) {
    const { mbid } = await params;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    let profile: ArtistProfile | null = null;
    let releaseGroups: DiscographyReleaseGroup[] | null = null;
    let canonicalReleaseGroups: DiscographyReleaseGroup[] | null = null;

    try {
        const [profileRes, discographyRes, canonicalRes] = await Promise.all([
            apiFetch(`catalog/artists/${mbid}`, cookieHeader),
            apiFetch(`catalog/artists/${mbid}/release-groups`, cookieHeader),
            apiFetch(
                `catalog/artists/${mbid}/release-groups?canonical=true`,
                cookieHeader,
            ),
        ]);

        if (profileRes.ok) {
            const payload = (await profileRes.json()) as
                | { artist: ArtistRow }
                | { jobId: string };
            if ("artist" in payload) profile = toProfile(payload.artist);
        }

        if (discographyRes.ok) {
            const payload = (await discographyRes.json()) as
                | { artist: ArtistRow; releaseGroups: ReleaseGroupRow[] }
                | { jobId?: string; pendingReleaseGroupCount?: number };
            if ("releaseGroups" in payload && payload.releaseGroups) {
                releaseGroups = payload.releaseGroups.map(toDiscographyItem);
                if (!profile && "artist" in payload && payload.artist) {
                    profile = toProfile(payload.artist);
                }
            }
        }

        if (canonicalRes.ok) {
            const payload = (await canonicalRes.json()) as
                | { artist: ArtistRow; releaseGroups: ReleaseGroupRow[] }
                | { jobId?: string; pendingReleaseGroupCount?: number };
            if ("releaseGroups" in payload && payload.releaseGroups) {
                canonicalReleaseGroups =
                    payload.releaseGroups.map(toDiscographyItem);
            }
        }
    } catch {
        // fall through — client will poll
    }

    return (
        <ArtistView
            mbid={mbid}
            initialProfile={profile}
            initialReleaseGroups={releaseGroups}
            initialCanonicalReleaseGroups={canonicalReleaseGroups}
        />
    );
}

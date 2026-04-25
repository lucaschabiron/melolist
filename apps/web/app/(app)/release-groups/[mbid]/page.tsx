import { cookies } from "next/headers";
import { apiBaseUrl } from "../../../../lib/config";
import AlbumView, { type ReleaseGroupResponse } from "./album-view";

type ReleaseGroupDetailPageProps = {
    params: Promise<{
        mbid: string;
    }>;
};

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

    if (response.status === 202) return null;
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
    const data = await fetchReleaseGroup(mbid);

    return <AlbumView mbid={mbid} initialData={data} pending={!data} />;
}

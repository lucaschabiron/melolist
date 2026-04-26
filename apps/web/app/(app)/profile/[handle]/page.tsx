import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiBaseUrl } from "../../../../lib/config";
import ProfileView, {
    type ProfileActivityItem,
    type ProfileData,
    type ProfileLibraryItem,
    type ProfileReviewItem,
    type ProfileSummary,
} from "./profile-view";

async function fetchProfile(
    handle: string,
    cookieHeader: string,
): Promise<ProfileData | null | "unauthorized"> {
    const res = await fetch(
        new URL(`users/${encodeURIComponent(handle)}`, apiBaseUrl),
        {
            headers: cookieHeader ? { cookie: cookieHeader } : undefined,
            cache: "no-store",
        },
    );
    if (res.status === 404) return null;
    if (res.status === 401) return "unauthorized";
    if (!res.ok) return null;
    return (await res.json()) as ProfileData;
}

async function apiFetch(path: string, cookieHeader: string) {
    return fetch(new URL(path, apiBaseUrl), {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: "no-store",
    });
}

async function fetchProfileSummary(handle: string, cookieHeader: string) {
    const res = await apiFetch(
        `users/${encodeURIComponent(handle)}/library/summary`,
        cookieHeader,
    );
    if (!res.ok) return null;
    const payload = (await res.json()) as
        | { privateProfile: true; message: string }
        | { privateProfile: false; summary: ProfileSummary };
    return "summary" in payload ? payload.summary : null;
}

async function fetchProfileActivity(handle: string, cookieHeader: string) {
    const res = await apiFetch(
        `users/${encodeURIComponent(handle)}/activity?limit=10`,
        cookieHeader,
    );
    if (!res.ok) return [];
    const payload = (await res.json()) as
        | { privateProfile: true; message: string }
        | { privateProfile: false; items: ProfileActivityItem[] };
    return "items" in payload ? payload.items : [];
}

async function fetchProfileLibrary(handle: string, cookieHeader: string) {
    const res = await apiFetch(
        `users/${encodeURIComponent(handle)}/library?limit=100`,
        cookieHeader,
    );
    if (!res.ok) return [];
    const payload = (await res.json()) as
        | { privateProfile: true; message: string }
        | { privateProfile: false; items: ProfileLibraryItem[] };
    return "items" in payload ? payload.items : [];
}

async function fetchProfileReviews(handle: string, cookieHeader: string) {
    const res = await apiFetch(
        `users/${encodeURIComponent(handle)}/reviews?limit=100`,
        cookieHeader,
    );
    if (!res.ok) return [];
    const payload = (await res.json()) as
        | { privateProfile: true; message: string }
        | { privateProfile: false; items: ProfileReviewItem[] };
    return "items" in payload ? payload.items : [];
}

export default async function ProfileDetailPage({
    params,
}: {
    params: Promise<{ handle: string }>;
}) {
    const { handle } = await params;
    const handleLower = handle.toLowerCase();
    if (handle !== handleLower) {
        redirect(`/profile/${handleLower}`);
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const [result, summary, activity, library, reviews] = await Promise.all([
        fetchProfile(handleLower, cookieHeader),
        fetchProfileSummary(handleLower, cookieHeader),
        fetchProfileActivity(handleLower, cookieHeader),
        fetchProfileLibrary(handleLower, cookieHeader),
        fetchProfileReviews(handleLower, cookieHeader),
    ]);
    if (result === "unauthorized") redirect("/login");
    if (!result) notFound();

    return (
        <ProfileView
            profile={result}
            summary={summary}
            activity={activity}
            library={library}
            reviews={reviews}
        />
    );
}

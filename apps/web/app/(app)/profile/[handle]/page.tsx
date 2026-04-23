import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiBaseUrl } from "../../../../lib/config";
import ProfileView, { type ProfileData } from "./profile-view";

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

    const result = await fetchProfile(handleLower, cookieHeader);
    if (result === "unauthorized") redirect("/login");
    if (!result) notFound();

    return <ProfileView profile={result} />;
}

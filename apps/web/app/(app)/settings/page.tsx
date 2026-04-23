import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiBaseUrl } from "../../../lib/config";
import SettingsView, { type MeResponse } from "./settings-view";

async function fetchMe(cookieHeader: string): Promise<MeResponse | null> {
    const res = await fetch(new URL("users/me", apiBaseUrl), {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MeResponse;
}

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const me = await fetchMe(cookieHeader);
    if (!me) redirect("/login");

    return <SettingsView me={me} />;
}

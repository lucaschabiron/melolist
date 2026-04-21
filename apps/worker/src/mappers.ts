import type { MbReleaseGroup } from "@melolist/musicbrainz";

export type ReleaseTypeValue =
    | "album"
    | "ep"
    | "single"
    | "live"
    | "compilation"
    | "mixtape"
    | "soundtrack"
    | "other";

export function mapReleaseType(rg: MbReleaseGroup): ReleaseTypeValue {
    const secondary = rg["secondary-types"] ?? [];
    if (secondary.includes("Live")) return "live";
    if (secondary.includes("Compilation")) return "compilation";
    if (secondary.includes("Soundtrack")) return "soundtrack";
    if (secondary.includes("Mixtape/Street")) return "mixtape";

    const primary = rg["primary-type"];
    switch (primary) {
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

export function isCanonicalAlbumReleaseGroup(
    releaseType: ReleaseTypeValue,
    secondaryTypes: string[],
): boolean {
    return releaseType === "album" && secondaryTypes.length === 0;
}

export function parseYear(partial?: string | null): number | null {
    if (!partial) return null;
    const match = partial.match(/^(\d{4})/);
    return match ? parseInt(match[1]!, 10) : null;
}

export function parseDate(partial?: string | null): string | null {
    if (!partial) return null;
    const parts = partial.split("-");
    const y = parts[0];
    if (!y || !/^\d{4}$/.test(y)) return null;
    const m = parts[1] && /^\d{2}$/.test(parts[1]) ? parts[1] : "01";
    const d = parts[2] && /^\d{2}$/.test(parts[2]) ? parts[2] : "01";
    return `${y}-${m}-${d}`;
}

export function joinArtistCredit(
    credits: MbReleaseGroup["artist-credit"] | undefined,
    fallback: string,
): string {
    if (!credits || credits.length === 0) return fallback;
    return credits
        .map((c) => `${c.name}${c.joinphrase ?? ""}`)
        .join("")
        .trim();
}

export type ReleaseStatusValue =
    | "official"
    | "promotion"
    | "bootleg"
    | "pseudo-release";

export function mapReleaseStatus(
    status?: string | null,
): ReleaseStatusValue | null {
    if (!status) return null;
    const normalized = status.toLowerCase();
    if (normalized === "official") return "official";
    if (normalized === "promotion") return "promotion";
    if (normalized === "bootleg") return "bootleg";
    if (normalized === "pseudo-release") return "pseudo-release";
    return null;
}

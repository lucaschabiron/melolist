"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { apiBaseUrl } from "../../../../lib/config";
import { GenericCover, Icon, StatusGlyph } from "../../_components/primitives";
import type { StatusId } from "../../release-groups/[mbid]/album-data";
import {
    COMMUNITY_RATING,
    PERSONAL_STATS,
    RELATED_ARTISTS,
    paletteFor,
} from "./artist-data";

export type ArtistProfile = {
    mbid: string;
    name: string;
    disambiguation: string | null;
    country: string | null;
    foundedYear: number | null;
    dissolvedYear: number | null;
    imageUrl: string | null;
};

type ReleaseTypeId =
    | "album"
    | "ep"
    | "single"
    | "live"
    | "compilation"
    | "mixtape"
    | "soundtrack"
    | "other";

export type DiscographyReleaseGroup = {
    mbid: string;
    title: string;
    releaseType: ReleaseTypeId;
    secondaryTypes: string[];
    firstReleaseDate: string | null;
};

type ArtistRowDto = {
    musicbrainzId: string;
    name: string;
    sortName: string | null;
    disambiguation: string | null;
    country: string | null;
    foundedYear: number | null;
    dissolvedYear: number | null;
};

type ReleaseGroupRowDto = {
    musicbrainzId: string;
    title: string;
    releaseType: ReleaseTypeId;
    secondaryTypes: string[] | null;
    firstReleaseDate: string | null;
};

type ArtistProfileResponse = { artist: ArtistRowDto } | { jobId: string };

type DiscographyResponse =
    | { artist: ArtistRowDto; releaseGroups: ReleaseGroupRowDto[] }
    | { jobId?: string; pendingReleaseGroupCount?: number };

function prettyReleaseType(value: ReleaseTypeId) {
    if (value === "ep") return "EP";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function yearOf(dateString: string | null): number | null {
    if (!dateString) return null;
    const y = Number(dateString.slice(0, 4));
    return Number.isFinite(y) ? y : null;
}

function formatYears(founded: number | null, dissolved: number | null) {
    if (founded && dissolved) return `${founded} – ${dissolved}`;
    if (founded) return `${founded} – present`;
    if (dissolved) return `disbanded ${dissolved}`;
    return null;
}

const OTHER_TAB_DEFINITIONS: Array<{
    id: string;
    label: string;
    match: (rg: DiscographyReleaseGroup) => boolean;
}> = [
    { id: "all", label: "All", match: () => true },
    {
        id: "eps",
        label: "EPs",
        match: (rg) => rg.releaseType === "ep",
    },
    {
        id: "singles",
        label: "Singles",
        match: (rg) => rg.releaseType === "single",
    },
    {
        id: "live",
        label: "Live",
        match: (rg) => rg.releaseType === "live",
    },
    {
        id: "compilations",
        label: "Compilations",
        match: (rg) => rg.releaseType === "compilation",
    },
    {
        id: "other",
        label: "Other",
        match: (rg) =>
            rg.releaseType === "mixtape" ||
            rg.releaseType === "soundtrack" ||
            rg.releaseType === "other",
    },
];

function sortByYearThenTitle(items: DiscographyReleaseGroup[]) {
    return [...items].sort((a, b) => {
        const yearA = yearOf(a.firstReleaseDate) ?? 0;
        const yearB = yearOf(b.firstReleaseDate) ?? 0;
        if (yearA !== yearB) return yearA - yearB;
        return a.title.localeCompare(b.title);
    });
}

function mapReleaseGroups(
    rows: ReleaseGroupRowDto[],
): DiscographyReleaseGroup[] {
    return rows.map((rg) => ({
        mbid: rg.musicbrainzId,
        title: rg.title,
        releaseType: rg.releaseType,
        secondaryTypes: rg.secondaryTypes ?? [],
        firstReleaseDate: rg.firstReleaseDate,
    }));
}

function usePolling(
    mbid: string,
    needsProfile: boolean,
    needsDiscography: boolean,
    needsCanonical: boolean,
    onProfile: (profile: ArtistProfile) => void,
    onReleaseGroups: (rgs: DiscographyReleaseGroup[]) => void,
    onCanonical: (rgs: DiscographyReleaseGroup[]) => void,
) {
    useEffect(() => {
        if (!needsProfile && !needsDiscography && !needsCanonical) return;

        let cancelled = false;
        const controller = new AbortController();

        const fetchReleaseGroups = async (
            canonical: boolean,
        ): Promise<DiscographyReleaseGroup[] | null> => {
            const qs = canonical ? "?canonical=true" : "";
            const res = await fetch(
                `${apiBaseUrl}catalog/artists/${mbid}/release-groups${qs}`,
                {
                    credentials: "include",
                    signal: controller.signal,
                    cache: "no-store",
                },
            );
            if (!res.ok) return null;
            const payload = (await res.json()) as DiscographyResponse;
            if (!("releaseGroups" in payload)) return null;
            return mapReleaseGroups(payload.releaseGroups);
        };

        const poll = async () => {
            try {
                if (needsProfile) {
                    const res = await fetch(
                        `${apiBaseUrl}catalog/artists/${mbid}`,
                        {
                            credentials: "include",
                            signal: controller.signal,
                            cache: "no-store",
                        },
                    );
                    if (res.ok) {
                        const payload =
                            (await res.json()) as ArtistProfileResponse;
                        if (!cancelled && "artist" in payload) {
                            onProfile({
                                mbid: payload.artist.musicbrainzId,
                                name: payload.artist.name,
                                disambiguation: payload.artist.disambiguation,
                                country: payload.artist.country,
                                foundedYear: payload.artist.foundedYear,
                                dissolvedYear: payload.artist.dissolvedYear,
                                imageUrl: null,
                            });
                        }
                    }
                }

                if (needsDiscography) {
                    const result = await fetchReleaseGroups(false);
                    if (!cancelled && result) onReleaseGroups(result);
                }

                if (needsCanonical) {
                    const result = await fetchReleaseGroups(true);
                    if (!cancelled && result) onCanonical(result);
                }
            } catch {
                // swallow — next tick will retry
            }
        };

        void poll();
        const interval = window.setInterval(poll, 3000);

        return () => {
            cancelled = true;
            controller.abort();
            window.clearInterval(interval);
        };
    }, [
        mbid,
        needsProfile,
        needsDiscography,
        needsCanonical,
        onProfile,
        onReleaseGroups,
        onCanonical,
    ]);
}

function ArtistImage({
    profile,
    className = "w-full max-w-70 aspect-square mx-auto md:mx-0",
    radius = 12,
}: {
    profile: ArtistProfile | null;
    className?: string;
    radius?: number;
}) {
    if (profile?.imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={profile.imageUrl}
                alt={`${profile.name} portrait`}
                className={`shrink-0 object-cover ${className}`}
                style={{ borderRadius: radius }}
            />
        );
    }
    const letter = profile?.name.trim()[0]?.toUpperCase() ?? "·";
    const palette: [string, string, string] = profile
        ? paletteFor(profile.mbid)
        : ["#1a1a1a", "#2e2e2e", "#4a4a4a"];
    return (
        <GenericCover
            className={className}
            radius={radius}
            palette={palette}
            label={letter}
        />
    );
}

function StatusMixBar({
    mix,
}: {
    mix: typeof PERSONAL_STATS.statusMix;
}) {
    const total = mix.reduce((sum, s) => sum + s.count, 0);
    const opacityFor = (id: StatusId): number => {
        switch (id) {
            case "loved":
                return 1;
            case "listened":
                return 0.78;
            case "listening":
                return 0.6;
            case "backlog":
                return 0.4;
            case "shelved":
                return 0.25;
        }
    };
    return (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-paper/5">
            {mix.map((segment) => (
                <div
                    key={segment.id}
                    className="h-full bg-paper"
                    style={{
                        width: `${(segment.count / total) * 100}%`,
                        opacity: opacityFor(segment.id),
                    }}
                    title={`${segment.count} ${segment.label.toLowerCase()}`}
                />
            ))}
        </div>
    );
}

function Header({
    profile,
    pending,
    following,
    onToggleFollow,
}: {
    profile: ArtistProfile | null;
    pending: boolean;
    following: boolean;
    onToggleFollow: () => void;
}) {
    const years = profile
        ? formatYears(profile.foundedYear, profile.dissolvedYear)
        : null;
    const metaParts: string[] = [];
    if (profile?.country) metaParts.push(profile.country);
    if (years) metaParts.push(years);
    if (profile?.disambiguation) metaParts.push(profile.disambiguation);

    return (
        <section className="pt-8 md:pt-16">
            <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-6 md:gap-8 lg:gap-12 items-start">
                <ArtistImage
                    profile={profile}
                    className="w-full max-w-56 sm:max-w-64 md:max-w-70 aspect-square mx-auto md:mx-0"
                    radius={12}
                />

                <div className="pt-1 w-full min-w-0">
                    <p
                        className="text-micro font-medium uppercase text-steel"
                        style={{ letterSpacing: "0.18em" }}
                    >
                        Artist
                    </p>
                    <h1
                        className="mt-3 text-h1 sm:text-[52px] md:text-display font-medium text-paper wrap-break-word"
                        style={{ lineHeight: 1.02, letterSpacing: "-0.02em" }}
                    >
                        {pending && !profile ? (
                            <span className="text-steel">Loading…</span>
                        ) : (
                            profile?.name
                        )}
                    </h1>

                    {metaParts.length > 0 && (
                        <div
                            className="mt-4 text-caption text-steel"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {metaParts.map((part, i) => (
                                <Fragment key={i}>
                                    {i > 0 && <span> · </span>}
                                    <span className="whitespace-nowrap">
                                        {part}
                                    </span>
                                </Fragment>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:gap-10">
                        <div>
                            <div
                                className="text-h1 md:text-display font-medium text-paper"
                                style={{
                                    lineHeight: 1,
                                    letterSpacing: "-0.02em",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {COMMUNITY_RATING.score.toFixed(1)}
                            </div>
                            <div
                                className="text-caption text-steel mt-2"
                                style={{
                                    fontVariantNumeric: "tabular-nums",
                                }}
                                title="Mock data — not yet in DB"
                            >
                                based on{" "}
                                {COMMUNITY_RATING.ratings.toLocaleString()}{" "}
                                ratings across the discography
                            </div>
                        </div>
                        <div
                            className="pb-1 text-caption text-steel"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                            title="Mock data — not yet in DB"
                        >
                            {COMMUNITY_RATING.followers.toLocaleString()}{" "}
                            followers
                        </div>
                    </div>

                    <div className="mt-9 flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={onToggleFollow}
                            className="inline-flex items-center gap-2 px-3.5 py-2.25 rounded-sm bg-transparent text-paper text-caption font-medium cursor-pointer transition-[border-color,opacity] duration-120"
                            style={{
                                border: `0.5px solid ${
                                    following
                                        ? "#F7F7F7"
                                        : "rgba(107,107,107,0.5)"
                                }`,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            <Icon
                                name={following ? "check" : "plus"}
                                size={14}
                                stroke={1.5}
                            />
                            <span>{following ? "Following" : "Follow"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function PersonalStrip() {
    const items: Array<{
        label: string;
        prefix?: string;
        icon?: React.ReactNode;
    }> = [
        {
            label: `${PERSONAL_STATS.albumsRated}/${PERSONAL_STATS.albumsInDiscography}`,
            prefix: "Rated",
        },
        {
            label: PERSONAL_STATS.averageRating.toFixed(1),
            prefix: "Avg",
        },
        { label: `${PERSONAL_STATS.reviews} reviews` },
        { label: PERSONAL_STATS.firstListened },
        {
            label: `${PERSONAL_STATS.owned} owned`,
            icon: <Icon name="disc" size={13} />,
        },
    ];
    return (
        <div className="mt-10 md:mt-14 bg-surface rounded-sm px-4 md:px-5 py-4">
            <StatusMixBar mix={PERSONAL_STATS.statusMix} />
            <div className="mt-3 flex flex-wrap items-center gap-y-1 text-caption text-steel">
                {PERSONAL_STATS.statusMix.map((s, i) => (
                    <Fragment key={s.id}>
                        <div className="inline-flex items-center gap-2 py-0.5">
                            <span className="text-paper">
                                <StatusGlyph kind={s.id} size={13} />
                            </span>
                            <span
                                className="text-paper"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {s.count}
                            </span>
                            <span className="text-steel">{s.label}</span>
                        </div>
                        {i < PERSONAL_STATS.statusMix.length - 1 && (
                            <span className="mx-3 md:mx-4 text-steel">·</span>
                        )}
                    </Fragment>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-y-1 text-caption text-steel border-t-[0.5px] border-(--hairline) pt-3">
                {items.map((it, i) => (
                    <Fragment key={i}>
                        <div className="inline-flex items-center gap-2 py-0.5">
                            {it.icon && (
                                <span className="text-paper">{it.icon}</span>
                            )}
                            {it.prefix && (
                                <span className="text-steel">{it.prefix}</span>
                            )}
                            <span
                                className="text-paper"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {it.label}
                            </span>
                        </div>
                        {i < items.length - 1 && (
                            <span className="mx-3 md:mx-4 text-steel">·</span>
                        )}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

function DiscographyCard({
    item,
    size = "md",
}: {
    item: DiscographyReleaseGroup;
    size?: "md" | "sm";
}) {
    const year = yearOf(item.firstReleaseDate);
    const letter = item.title.trim()[0]?.toUpperCase() ?? "?";
    const palette = paletteFor(item.mbid);
    const secondary = item.secondaryTypes.join(" · ");
    const typeLine = [prettyReleaseType(item.releaseType), secondary]
        .filter(Boolean)
        .join(" · ");
    const tileSize = size === "md" ? 72 : 56;
    return (
        <Link
            href={`/release-groups/${item.mbid}`}
            className="flex items-start gap-4 rounded-md px-3 py-3 -mx-3 no-underline text-paper transition-colors duration-120 hover:bg-paper/3"
        >
            <GenericCover
                size={tileSize}
                radius={6}
                palette={palette}
                label={letter}
            />
            <div className="min-w-0 flex-1 pt-0.5">
                <div
                    className="text-body font-medium text-paper truncate"
                    style={{ letterSpacing: "-0.005em" }}
                >
                    {item.title}
                </div>
                <div
                    className="mt-1 text-caption text-steel truncate"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {year ?? "—"}
                    {size === "sm" && typeLine ? <> · {typeLine}</> : null}
                </div>
            </div>
        </Link>
    );
}

function CanonicalDiscography({
    items,
    pending,
}: {
    items: DiscographyReleaseGroup[] | null;
    pending: boolean;
}) {
    const canonical = useMemo(
        () => (items ? sortByYearThenTitle(items) : []),
        [items],
    );

    return (
        <section>
            <div className="flex items-baseline justify-between mb-8">
                <h2
                    className="text-h2 font-medium"
                    style={{ letterSpacing: "-0.01em" }}
                >
                    Discography
                </h2>
                {canonical.length > 0 && (
                    <span
                        className="text-caption text-steel"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {canonical.length} studio{" "}
                        {canonical.length === 1 ? "album" : "albums"}
                    </span>
                )}
            </div>

            {pending && !items ? (
                <div className="rounded-sm border-[0.5px] border-(--hairline) bg-surface px-4 py-6 text-caption text-steel">
                    Pulling the discography from MusicBrainz…
                </div>
            ) : canonical.length === 0 ? (
                <div className="rounded-sm border-[0.5px] border-(--hairline) bg-surface px-4 py-6 text-caption text-steel">
                    No studio albums with official releases yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                    {canonical.map((item) => (
                        <DiscographyCard
                            key={item.mbid}
                            item={item}
                            size="md"
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function OtherReleases({
    items,
    canonicalMbids,
    pending,
}: {
    items: DiscographyReleaseGroup[] | null;
    canonicalMbids: Set<string>;
    pending: boolean;
}) {
    const [tab, setTab] = useState<string>("all");

    const nonCanonical = useMemo(() => {
        if (!items) return null;
        return items.filter((rg) => !canonicalMbids.has(rg.mbid));
    }, [items, canonicalMbids]);

    const counts = useMemo(() => {
        const m = new Map<string, number>();
        if (!nonCanonical) return m;
        for (const def of OTHER_TAB_DEFINITIONS) {
            m.set(def.id, nonCanonical.filter(def.match).length);
        }
        return m;
    }, [nonCanonical]);

    const visible = useMemo(() => {
        if (!nonCanonical) return [];
        const def = OTHER_TAB_DEFINITIONS.find((d) => d.id === tab);
        if (!def) return sortByYearThenTitle(nonCanonical);
        return sortByYearThenTitle(nonCanonical.filter(def.match));
    }, [nonCanonical, tab]);

    if (!pending && nonCanonical && nonCanonical.length === 0) return null;

    return (
        <section>
            <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-baseline md:justify-between md:gap-6">
                <h2
                    className="text-h2 font-medium"
                    style={{ letterSpacing: "-0.01em" }}
                >
                    Other releases
                </h2>
                <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex items-center gap-4 text-caption overflow-x-auto h-scroll">
                    {OTHER_TAB_DEFINITIONS.map((def) => {
                        const active = tab === def.id;
                        const count = counts.get(def.id) ?? 0;
                        if (def.id !== "all" && count === 0) return null;
                        return (
                            <button
                                key={def.id}
                                onClick={() => setTab(def.id)}
                                className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium p-0 pb-0.5 transition-colors duration-120 inline-flex items-center gap-1.5"
                                style={{
                                    color: active ? "#F7F7F7" : "#6B6B6B",
                                    borderBottom: active
                                        ? "1px solid #F7F7F7"
                                        : "1px solid transparent",
                                }}
                            >
                                <span>{def.label}</span>
                                <span
                                    className="text-steel"
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {pending && !items ? (
                <div className="rounded-sm border-[0.5px] border-(--hairline) bg-surface px-4 py-6 text-caption text-steel">
                    Loading releases…
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-sm border-[0.5px] border-(--hairline) bg-surface px-4 py-6 text-caption text-steel">
                    Nothing in this category.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                    {visible.map((item) => (
                        <DiscographyCard
                            key={item.mbid}
                            item={item}
                            size="sm"
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function RelatedArtists() {
    return (
        <section>
            <div className="flex items-baseline justify-between mb-6">
                <h2
                    className="text-h2 font-medium"
                    style={{ letterSpacing: "-0.01em" }}
                >
                    Listeners also follow
                </h2>
                <span
                    className="text-caption text-steel"
                    title="Mock data — not yet in DB"
                >
                    Based on overlapping libraries
                </span>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-1 h-scroll">
                {RELATED_ARTISTS.map((artist) => (
                    <div key={artist.name} className="w-40 shrink-0">
                        <GenericCover
                            size={160}
                            radius={8}
                            palette={artist.palette}
                            label={artist.letter}
                        />
                        <div className="mt-3 text-[14px] font-medium text-paper truncate">
                            {artist.name}
                        </div>
                        <div
                            className="mt-0.5 text-[12px] text-steel truncate"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {[artist.origin, artist.foundedYear]
                                .filter(Boolean)
                                .join(" · ")}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function ArtistView({
    mbid,
    initialProfile,
    initialReleaseGroups,
    initialCanonicalReleaseGroups,
}: {
    mbid: string;
    initialProfile: ArtistProfile | null;
    initialReleaseGroups: DiscographyReleaseGroup[] | null;
    initialCanonicalReleaseGroups: DiscographyReleaseGroup[] | null;
}) {
    const [profile, setProfile] = useState<ArtistProfile | null>(
        initialProfile,
    );
    const [releaseGroups, setReleaseGroups] = useState<
        DiscographyReleaseGroup[] | null
    >(initialReleaseGroups);
    const [canonicalReleaseGroups, setCanonicalReleaseGroups] = useState<
        DiscographyReleaseGroup[] | null
    >(initialCanonicalReleaseGroups);
    const [following, setFollowing] = useState(false);

    const needsProfile = profile === null;
    const needsDiscography = releaseGroups === null;
    const needsCanonical = canonicalReleaseGroups === null;

    const handleProfile = useCallback((next: ArtistProfile) => {
        setProfile(next);
    }, []);
    const handleReleaseGroups = useCallback(
        (next: DiscographyReleaseGroup[]) => {
            setReleaseGroups(next);
        },
        [],
    );
    const handleCanonical = useCallback(
        (next: DiscographyReleaseGroup[]) => {
            setCanonicalReleaseGroups(next);
        },
        [],
    );

    usePolling(
        mbid,
        needsProfile,
        needsDiscography,
        needsCanonical,
        handleProfile,
        handleReleaseGroups,
        handleCanonical,
    );

    const canonicalMbids = useMemo(
        () => new Set(canonicalReleaseGroups?.map((rg) => rg.mbid) ?? []),
        [canonicalReleaseGroups],
    );

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
            <Header
                profile={profile}
                pending={needsProfile}
                following={following}
                onToggleFollow={() => setFollowing((v) => !v)}
            />

            <PersonalStrip />

            <div className="h-16 md:h-24" />
            <CanonicalDiscography
                items={canonicalReleaseGroups}
                pending={needsCanonical}
            />

            <div className="h-16 md:h-24" />
            <OtherReleases
                items={releaseGroups}
                canonicalMbids={canonicalMbids}
                pending={needsDiscography}
            />

            <div className="h-16 md:h-24" />
            <RelatedArtists />

            <div className="h-16 md:h-24" />
        </main>
    );
}

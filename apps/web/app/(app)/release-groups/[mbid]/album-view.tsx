"use client";

import { Fragment, useEffect, useId, useMemo, useState } from "react";
import { apiBaseUrl } from "../../../../lib/config";
import {
    GenericCover,
    Icon,
    Stars,
    StatusGlyph,
} from "../../_components/primitives";
import { STATUSES, type StatusId } from "./album-data";

export type AlbumHeaderData = {
    title: string;
    artist: string;
    artistMbid: string | null;
    year: number | null;
    type: string;
    secondaryTypes: string[];
    coverArtUrl: string | null;
};

type ReleaseGroupRow = {
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

type ArtistReleaseGroupRow = {
    musicbrainzId: string;
    title: string;
    releaseType: ReleaseGroupRow["releaseType"];
    secondaryTypes: string[] | null;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
};

type ArtistRow = {
    musicbrainzId: string;
    name: string;
} | null;

type ReleaseRow = {
    musicbrainzId: string;
    title: string;
    status: string | null;
    releaseDate: string | null;
    country: string | null;
};

export type AlbumTrack = {
    id: string;
    musicbrainzId: string | null;
    recordingMbid: string | null;
    position: number;
    number: string | null;
    title: string;
    lengthMs: number | null;
};

export type AlbumMedium = {
    id: string;
    position: number;
    format: string | null;
    title: string | null;
    trackCount: number | null;
    tracks: AlbumTrack[];
};

export type ReleaseGroupResponse = {
    releaseGroup: ReleaseGroupRow;
    artist: ArtistRow;
    tracksStatus: "pending" | "seeding" | "ready" | "failed";
    selectedRelease: ReleaseRow | null;
    media: AlbumMedium[];
    editions: ReleaseRow[];
};

type PendingResponse = {
    jobId: string;
    pollUrl: string;
};

type ArtistReleaseGroupsResponse = {
    releaseGroups: ArtistReleaseGroupRow[];
};

type AlbumMetrics = {
    trackCount: number;
    runtimeMs: number;
};

type ActionBtnProps = {
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
};

function prettyReleaseType(value: ReleaseGroupRow["releaseType"]) {
    if (value === "ep") return "EP";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function headerFromResponse(data: ReleaseGroupResponse): AlbumHeaderData {
    const { releaseGroup, artist } = data;
    return {
        title: releaseGroup.title,
        artist: artist?.name ?? releaseGroup.primaryArtistCredit,
        artistMbid: artist?.musicbrainzId ?? null,
        year: releaseGroup.firstReleaseDate
            ? Number(releaseGroup.firstReleaseDate.slice(0, 4))
            : null,
        type: prettyReleaseType(releaseGroup.releaseType),
        secondaryTypes: releaseGroup.secondaryTypes ?? [],
        coverArtUrl: releaseGroup.coverArtUrl,
    };
}

function albumMetrics(media: AlbumMedium[]): AlbumMetrics {
    return media.reduce(
        (totals, medium) => ({
            trackCount: totals.trackCount + medium.tracks.length,
            runtimeMs:
                totals.runtimeMs +
                medium.tracks.reduce(
                    (sum, track) => sum + (track.lengthMs ?? 0),
                    0,
                ),
        }),
        { trackCount: 0, runtimeMs: 0 },
    );
}

function formatDuration(lengthMs: number | null): string {
    if (lengthMs === null) return "--:--";
    const totalSeconds = Math.round(lengthMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatRuntime(lengthMs: number): string {
    const minutes = Math.round(lengthMs / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function SkeletonBlock({ className }: { className: string }) {
    return (
        <div
            className={`animate-pulse rounded-sm bg-surface ${className}`}
            aria-hidden="true"
        />
    );
}

function EmptyState({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-md border-[0.5px] border-(--hairline) bg-surface px-5 py-6 text-caption text-steel">
            {children}
        </div>
    );
}

function AlbumCover({
    header,
    className = "w-full max-w-[320px] aspect-square",
    radius = 12,
}: {
    header: AlbumHeaderData | null;
    className?: string;
    radius?: number;
}) {
    if (header?.coverArtUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={header.coverArtUrl}
                alt={`${header.title} cover`}
                className={`shrink-0 object-cover ${className}`}
                style={{ borderRadius: radius }}
            />
        );
    }

    if (header) {
        return (
            <GenericCover
                className={className}
                radius={radius}
                palette={["#1a1a1a", "#2e2e2e", "#4a4a4a"]}
                label={header.title.trim()[0]?.toUpperCase() ?? "?"}
            />
        );
    }

    return <SkeletonBlock className={className} />;
}

function ActionBtn({
    active = false,
    disabled = false,
    onClick,
    children,
}: ActionBtnProps) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="inline-flex items-center gap-2 px-[14px] py-[9px] rounded-sm bg-transparent text-paper text-caption font-medium cursor-pointer transition-[border-color,opacity] duration-120 disabled:cursor-default disabled:opacity-45"
            style={{
                border: `0.5px solid ${
                    active ? "#F7F7F7" : "rgba(107,107,107,0.5)"
                }`,
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {children}
        </button>
    );
}

function AlbumHeader({
    header,
    data,
    metrics,
    status,
    setStatus,
    userRating,
    setUserRating,
    ratingOpen,
    setRatingOpen,
    onWriteReview,
}: {
    header: AlbumHeaderData | null;
    data: ReleaseGroupResponse | null;
    metrics: AlbumMetrics;
    status: StatusId;
    setStatus: (s: StatusId) => void;
    userRating: number;
    setUserRating: (v: number) => void;
    ratingOpen: boolean;
    setRatingOpen: (v: boolean) => void;
    onWriteReview: () => void;
}) {
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const currentStatus = STATUSES.find((s) => s.id === status)!;

    return (
        <section className="pt-8 md:pt-16">
            <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[320px_1fr] gap-6 md:gap-8 lg:gap-12 items-start">
                <AlbumCover
                    header={header}
                    className="w-full max-w-60 sm:max-w-70 md:max-w-[320px] aspect-square mx-auto md:mx-0"
                    radius={12}
                />

                <div className="pt-1 w-full min-w-0">
                    {header ? (
                        <>
                            {header.artistMbid ? (
                                <a
                                    href={`/artists/${header.artistMbid}`}
                                    className="text-[16px] md:text-h3 font-normal text-paper no-underline"
                                    style={{ letterSpacing: "-0.005em" }}
                                >
                                    {header.artist}
                                </a>
                            ) : (
                                <div
                                    className="text-[16px] md:text-h3 font-normal text-paper"
                                    style={{ letterSpacing: "-0.005em" }}
                                >
                                    {header.artist}
                                </div>
                            )}

                            <h1
                                className="text-[32px] sm:text-[44px] md:text-display font-medium text-paper mt-1.5 wrap-break-word"
                                style={{
                                    lineHeight: 1.02,
                                    letterSpacing: "-0.02em",
                                    margin: "6px 0 0",
                                }}
                            >
                                {header.title}
                            </h1>

                            <div
                                className="mt-[18px] text-caption text-steel"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {header.year !== null && (
                                    <>
                                        <span className="whitespace-nowrap">
                                            {header.year}
                                        </span>
                                        <span> · </span>
                                    </>
                                )}
                                <span className="whitespace-nowrap">
                                    {header.type}
                                </span>
                                {header.secondaryTypes.map((type) => (
                                    <Fragment key={type}>
                                        <span> · </span>
                                        <span className="whitespace-nowrap">
                                            {type}
                                        </span>
                                    </Fragment>
                                ))}
                                {metrics.trackCount > 0 && (
                                    <>
                                        <span> · </span>
                                        <span className="whitespace-nowrap">
                                            {metrics.trackCount} tracks
                                        </span>
                                    </>
                                )}
                                {metrics.runtimeMs > 0 && (
                                    <>
                                        <span> · </span>
                                        <span className="whitespace-nowrap">
                                            {formatRuntime(metrics.runtimeMs)}
                                        </span>
                                    </>
                                )}
                            </div>

                            {data?.selectedRelease && (
                                <div
                                    className="mt-[6px] text-caption text-steel"
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    <span>
                                        Official tracklist from{" "}
                                        {data.selectedRelease.title}
                                    </span>
                                    {data.selectedRelease.releaseDate && (
                                        <>
                                            <span> · </span>
                                            <span>
                                                {
                                                    data.selectedRelease
                                                        .releaseDate
                                                }
                                            </span>
                                        </>
                                    )}
                                    {data.selectedRelease.country && (
                                        <>
                                            <span> · </span>
                                            <span>
                                                {data.selectedRelease.country}
                                            </span>
                                        </>
                                    )}
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
                                        --
                                    </div>
                                    <div className="text-caption text-steel mt-2">
                                        ratings coming later
                                    </div>
                                </div>
                                <div className="w-full max-w-65 pb-1.5">
                                    <div
                                        className="text-micro font-medium text-steel mb-2"
                                        style={{ letterSpacing: "0.04em" }}
                                    >
                                        Distribution
                                    </div>
                                    <EmptyState>No rating data yet.</EmptyState>
                                </div>
                            </div>

                            <div className="mt-9 flex flex-wrap gap-[10px] items-center">
                                <div className="relative">
                                    <ActionBtn
                                        active={status !== "backlog"}
                                        onClick={() =>
                                            setStatusMenuOpen(!statusMenuOpen)
                                        }
                                    >
                                        <span className="text-paper">
                                            <StatusGlyph
                                                kind={status}
                                                size={14}
                                            />
                                        </span>
                                        <span>{currentStatus.label}</span>
                                        <span className="text-steel ml-[2px]">
                                            <Icon
                                                name="chev-down"
                                                size={14}
                                                stroke={1.5}
                                            />
                                        </span>
                                    </ActionBtn>
                                    {statusMenuOpen && (
                                        <div
                                            className="absolute left-0 z-10 bg-surface rounded-sm p-[6px] min-w-[180px]"
                                            style={{
                                                top: "calc(100% + 6px)",
                                            }}
                                        >
                                            {STATUSES.map((s) => (
                                                <StatusMenuItem
                                                    key={s.id}
                                                    id={s.id}
                                                    label={s.label}
                                                    active={s.id === status}
                                                    onSelect={() => {
                                                        setStatus(s.id);
                                                        setStatusMenuOpen(
                                                            false,
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <ActionBtn
                                    active={ratingOpen}
                                    onClick={() => setRatingOpen(!ratingOpen)}
                                >
                                    <Icon name="edit" size={14} />
                                    <span>
                                        {userRating > 0
                                            ? `Rated ${userRating}`
                                            : "Rate"}
                                    </span>
                                </ActionBtn>

                                <ActionBtn onClick={onWriteReview}>
                                    <Icon name="edit" size={14} />
                                    <span>Write review</span>
                                </ActionBtn>

                                <ActionBtn disabled>
                                    <Icon name="rotate" size={14} />
                                    <span>Log revisit</span>
                                </ActionBtn>

                                <ActionBtn disabled>
                                    <Icon name="disc" size={14} />
                                    <span>I own this</span>
                                </ActionBtn>
                            </div>

                            {ratingOpen && (
                                <div className="mt-4 px-5 py-4 bg-surface rounded-sm flex items-center gap-5">
                                    <Stars
                                        value={userRating}
                                        max={10}
                                        size={22}
                                        onChange={setUserRating}
                                        idPrefix="inline-rate"
                                    />
                                    <div
                                        className="text-[15px] text-paper min-w-[44px]"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {userRating > 0 ? (
                                            `${userRating.toFixed(1)}/10`
                                        ) : (
                                            <span className="text-steel">
                                                -- / 10
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => setRatingOpen(false)}
                                        className="bg-transparent border-0 text-steel cursor-pointer text-caption"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <SkeletonBlock className="h-5 w-36" />
                            <SkeletonBlock className="h-12 w-full max-w-160" />
                            <SkeletonBlock className="h-4 w-72" />
                            <SkeletonBlock className="h-4 w-56" />
                            <div className="mt-6 flex gap-4">
                                <SkeletonBlock className="h-16 w-24" />
                                <SkeletonBlock className="h-16 w-48" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function StatusMenuItem({
    id,
    label,
    active,
    onSelect,
}: {
    id: StatusId;
    label: string;
    active: boolean;
    onSelect: () => void;
}) {
    const [hover, setHover] = useState(false);
    const color = active || hover ? "#F7F7F7" : "#6B6B6B";
    return (
        <button
            onClick={onSelect}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="flex items-center gap-[10px] px-[10px] py-2 w-full bg-transparent border-0 cursor-pointer text-caption font-medium rounded-sm text-left"
            style={{ color }}
        >
            <StatusGlyph kind={id} size={14} />
            {label}
        </button>
    );
}

function PersonalStrip({
    status,
    userRating,
}: {
    status: StatusId;
    userRating: number;
}) {
    const currentStatus = STATUSES.find((s) => s.id === status)!;
    const items: Array<{
        label: string;
        prefix?: string;
        icon?: React.ReactNode;
    }> = [
        {
            label: currentStatus.label,
            icon: <StatusGlyph kind={status} size={13} />,
        },
        {
            label: userRating > 0 ? `${userRating.toFixed(1)}/10` : "Not rated",
            prefix: "Your rating",
        },
        { label: "No listen date" },
        { label: "No reviews" },
        { label: "Not owned", icon: <Icon name="disc" size={13} /> },
    ];
    return (
        <div className="mt-8 md:mt-12 bg-surface rounded-sm px-4 md:px-5 py-3 flex flex-wrap items-center gap-y-1 text-caption text-steel">
            {items.map((it, i) => (
                <Fragment key={i}>
                    <div className="inline-flex items-center gap-2 py-[2px]">
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
                        <span className="mx-3 md:mx-4.5 text-steel">·</span>
                    )}
                </Fragment>
            ))}
        </div>
    );
}

const TRACK_GRID =
    "grid items-center gap-3 md:gap-4 grid-cols-[24px_1fr_44px_52px] md:grid-cols-[28px_1fr_120px_60px_56px]";

function TrackRow({ track }: { track: AlbumTrack }) {
    const [hover, setHover] = useState(false);
    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={`${TRACK_GRID} py-3.5 relative`}
        >
            <div
                className="text-caption text-steel text-right"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {track.number ?? track.position}
            </div>
            <div className="text-[15px] text-paper min-w-0 truncate">
                {track.title}
            </div>
            <div className="hidden md:block text-caption text-steel">--</div>
            <div
                className="text-caption text-steel text-right"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                --
            </div>
            <div
                className="text-caption text-steel text-right"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {formatDuration(track.lengthMs)}
            </div>
            <div
                className="absolute left-0 right-0 bottom-0 h-px"
                style={{
                    background: "rgba(247,247,247,0.3)",
                    opacity: hover ? 1 : 0,
                    transition: "opacity 120ms ease-out",
                }}
            />
        </div>
    );
}

function TracklistSkeleton() {
    return (
        <div>
            <SkeletonBlock className="h-8 w-32 mb-3" />
            <SkeletonBlock className="h-9 w-full mb-2" />
            <div className="flex flex-col gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-9 w-full" />
                ))}
            </div>
        </div>
    );
}

function Tracklist({
    status,
    media,
    metrics,
}: {
    status: ReleaseGroupResponse["tracksStatus"];
    media: AlbumMedium[];
    metrics: AlbumMetrics;
}) {
    if (status !== "ready") return <TracklistSkeleton />;

    const hasTracks = media.some((medium) => medium.tracks.length > 0);

    return (
        <div>
            <h2
                className="text-h3 font-medium mb-3"
                style={{ letterSpacing: "-0.005em" }}
            >
                Tracklist
            </h2>
            <div
                className={`${TRACK_GRID} py-2 border-b-[0.5px] border-(--hairline) text-micro font-medium text-steel`}
                style={{ letterSpacing: "0.04em" }}
            >
                <div className="text-right">#</div>
                <div>Track</div>
                <div className="hidden md:block">Your rating</div>
                <div className="text-right">Comm.</div>
                <div className="text-right">Time</div>
            </div>

            {hasTracks ? (
                media.map((medium) => (
                    <div key={medium.id}>
                        {(media.length > 1 || medium.title) && (
                            <div className="pt-5 pb-2 text-caption font-medium text-steel">
                                Disc {medium.position}
                                {medium.title ? `: ${medium.title}` : ""}
                                {medium.format ? ` · ${medium.format}` : ""}
                            </div>
                        )}
                        {medium.tracks.map((track) => (
                            <TrackRow key={track.id} track={track} />
                        ))}
                    </div>
                ))
            ) : (
                <div className="pt-5">
                    <EmptyState>
                        Official tracklist unavailable from MusicBrainz.
                    </EmptyState>
                </div>
            )}

            {hasTracks && (
                <div
                    className="mt-[14px] pt-[14px] border-t-[0.5px] border-(--hairline) flex justify-between text-caption text-steel"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    <span>{metrics.trackCount} tracks</span>
                    {metrics.runtimeMs > 0 && (
                        <span>{formatRuntime(metrics.runtimeMs)}</span>
                    )}
                </div>
            )}
        </div>
    );
}

const creditLinkClass =
    "text-paper no-underline border-b-[0.5px] border-(--hairline) pb-[1px]";

function Sidebar({ header }: { header: AlbumHeaderData | null }) {
    return (
        <aside className="flex flex-col gap-10">
            <div>
                <h3
                    className="text-micro font-medium text-steel mb-4"
                    style={{ letterSpacing: "0.04em" }}
                >
                    Credits
                </h3>
                <EmptyState>Credits are not available yet.</EmptyState>
            </div>

            <div>
                <h3
                    className="text-micro font-medium text-steel mb-4"
                    style={{ letterSpacing: "0.04em" }}
                >
                    Appears on
                </h3>
                <EmptyState>
                    Lists containing {header?.title ?? "this album"} will appear
                    here.
                </EmptyState>
            </div>

            {header?.artistMbid && (
                <div className="text-caption">
                    <a
                        href={`/artists/${header.artistMbid}`}
                        className={creditLinkClass}
                    >
                        View artist discography
                    </a>
                </div>
            )}
        </aside>
    );
}

function YourReview({ onWriteReview }: { onWriteReview: () => void }) {
    return (
        <section>
            <h2 className="text-[20px] font-medium mb-5">Your review</h2>
            <article className="bg-surface rounded-md p-6 md:p-8">
                <EmptyState>
                    You have not reviewed this album yet.
                    <button
                        onClick={onWriteReview}
                        className="mt-4 block px-4 py-[9px] rounded-sm bg-paper border-0 text-ink text-caption font-medium cursor-pointer"
                    >
                        Write review
                    </button>
                </EmptyState>
            </article>
        </section>
    );
}

const SORT_OPTIONS = [
    { id: "recent", label: "Most recent" },
    { id: "helpful", label: "Most helpful" },
    { id: "highest", label: "Highest rated" },
    { id: "lowest", label: "Lowest rated" },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

function CommunityReviews() {
    const [sort, setSort] = useState<SortId>("helpful");
    return (
        <section>
            <div className="flex flex-col gap-4 mb-9 md:flex-row md:items-baseline md:justify-between md:gap-6">
                <h2
                    className="text-h2 font-medium"
                    style={{ letterSpacing: "-0.01em" }}
                >
                    Community reviews
                </h2>
                <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex items-center gap-4 text-caption overflow-x-auto h-scroll">
                    {SORT_OPTIONS.map((s) => {
                        const active = sort === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSort(s.id)}
                                className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium p-0 pb-0.5 transition-colors duration-120"
                                style={{
                                    color: active ? "#F7F7F7" : "#6B6B6B",
                                    borderBottom: active
                                        ? "1px solid #F7F7F7"
                                        : "1px solid transparent",
                                }}
                            >
                                {s.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <EmptyState>Community reviews will appear here.</EmptyState>
        </section>
    );
}

function EditionsRow({ data }: { data: ReleaseGroupResponse | null }) {
    const editions = data?.editions ?? [];
    return (
        <section>
            <div className="flex items-baseline justify-between mb-6">
                <h2
                    className="text-h2 font-medium"
                    style={{ letterSpacing: "-0.01em" }}
                >
                    Editions
                </h2>
                <span
                    className="text-caption text-steel"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {editions.length > 0
                        ? `${editions.length} known ${
                              editions.length === 1 ? "edition" : "editions"
                          }`
                        : "No editions yet"}
                </span>
            </div>
            {editions.length > 0 ? (
                <div className="flex gap-5 overflow-x-auto pb-1 h-scroll">
                    {editions.map((edition) => (
                        <div
                            key={edition.musicbrainzId}
                            className="w-[172px] shrink-0 relative"
                        >
                            <GenericCover
                                size={90}
                                radius={8}
                                palette={["#1a1a1a", "#2e2e2e", "#4a4a4a"]}
                                label={edition.title[0] ?? "R"}
                            />
                            <div
                                className="mt-3 text-[14px] text-paper font-medium"
                                style={{ lineHeight: 1.3 }}
                            >
                                {edition.title}
                            </div>
                            <div
                                className="mt-1 text-[12px] text-steel"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {edition.status ?? "Release"}
                                {edition.country ? ` · ${edition.country}` : ""}
                                {edition.releaseDate
                                    ? ` · ${edition.releaseDate.slice(0, 4)}`
                                    : ""}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState>
                    Release editions have not been loaded yet.
                </EmptyState>
            )}
        </section>
    );
}

function MoreFromCard({ item }: { item: ArtistReleaseGroupRow }) {
    const year = item.firstReleaseDate?.slice(0, 4);
    return (
        <a
            href={`/release-groups/${item.musicbrainzId}`}
            className="w-[160px] shrink-0 no-underline text-paper"
        >
            {item.coverArtUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={item.coverArtUrl}
                    alt={`${item.title} cover`}
                    className="w-40 h-40 object-cover rounded-md"
                />
            ) : (
                <GenericCover
                    size={160}
                    radius={8}
                    palette={["#1a1a1a", "#2e2e2e", "#4a4a4a"]}
                    label={item.title[0] ?? "R"}
                />
            )}
            <div className="mt-3 text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                {item.title}
            </div>
            <div
                className="mt-1 text-[12px] text-steel"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {year ?? "Release date unknown"}
            </div>
        </a>
    );
}

function MoreFromSkeleton() {
    return (
        <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[160px] shrink-0">
                    <SkeletonBlock className="w-40 h-40" />
                    <SkeletonBlock className="mt-3 h-4 w-32" />
                    <SkeletonBlock className="mt-2 h-3 w-16" />
                </div>
            ))}
        </div>
    );
}

async function fetchMoreFromArtist(
    artistMbid: string,
    currentMbid: string,
): Promise<ArtistReleaseGroupRow[]> {
    const response = await fetch(
        new URL(
            `catalog/artists/${artistMbid}/release-groups?type=album`,
            apiBaseUrl,
        ),
        { credentials: "include", cache: "no-store" },
    );
    if (response.status === 202) return [];
    if (!response.ok)
        throw new Error(`artist albums failed (${response.status})`);

    const payload = (await response.json()) as
        | ArtistReleaseGroupsResponse
        | PendingResponse;
    if ("jobId" in payload) return [];

    return payload.releaseGroups
        .filter((rg) => rg.musicbrainzId !== currentMbid)
        .filter((rg) => (rg.secondaryTypes ?? []).length === 0)
        .sort((a, b) => {
            const aDate = a.firstReleaseDate ?? "9999-99-99";
            const bDate = b.firstReleaseDate ?? "9999-99-99";
            return aDate.localeCompare(bDate);
        })
        .slice(0, 12);
}

function RelatedSections({
    header,
    currentMbid,
}: {
    header: AlbumHeaderData | null;
    currentMbid: string;
}) {
    const artistName = header?.artist ?? "this artist";
    const [moreFrom, setMoreFrom] = useState<ArtistReleaseGroupRow[] | null>(
        null,
    );

    useEffect(() => {
        if (!header?.artistMbid) {
            setMoreFrom([]);
            return;
        }

        let cancelled = false;
        setMoreFrom(null);

        void fetchMoreFromArtist(header.artistMbid, currentMbid)
            .then((items) => {
                if (!cancelled) setMoreFrom(items);
            })
            .catch(() => {
                if (!cancelled) setMoreFrom([]);
            });

        return () => {
            cancelled = true;
        };
    }, [currentMbid, header?.artistMbid]);

    return (
        <div className="flex flex-col gap-16 md:gap-24">
            <section>
                <div className="flex items-baseline justify-between mb-6">
                    <h2
                        className="text-h2 font-medium"
                        style={{ letterSpacing: "-0.01em" }}
                    >
                        More from {artistName}
                    </h2>
                    {header?.artistMbid && (
                        <a
                            href={`/artists/${header.artistMbid}`}
                            className="text-steel text-caption no-underline"
                        >
                            Discography →
                        </a>
                    )}
                </div>
                {moreFrom === null ? (
                    <MoreFromSkeleton />
                ) : moreFrom.length > 0 ? (
                    <div className="flex gap-6 overflow-x-auto pb-1 h-scroll">
                        {moreFrom.map((item) => (
                            <MoreFromCard
                                key={item.musicbrainzId}
                                item={item}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState>
                        No other canonical albums found for this artist.
                    </EmptyState>
                )}
            </section>
            <section>
                <div className="mb-6">
                    <h2
                        className="text-h2 font-medium"
                        style={{ letterSpacing: "-0.01em" }}
                    >
                        Listeners who liked this also liked
                    </h2>
                    <div className="mt-[6px] text-caption text-steel">
                        Based on listener ratings.
                    </div>
                </div>
                <EmptyState>Recommendations will appear here.</EmptyState>
            </section>
        </div>
    );
}

function ReviewDrawer({
    open,
    rating,
    setRating,
    onClose,
}: {
    open: boolean;
    rating: number;
    setRating: (rating: number) => void;
    onClose: () => void;
}) {
    const dateId = useId();
    const reviewId = useId();
    const tagsId = useId();
    return (
        <>
            <div
                className="fixed inset-0 z-50"
                onClick={onClose}
                style={{
                    background: "rgba(13,13,13,0.6)",
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? "auto" : "none",
                    transition: "opacity 150ms ease-out",
                }}
            />
            <div
                className="fixed top-0 right-0 bottom-0 w-full max-w-130 bg-surface flex flex-col"
                style={{
                    zIndex: 51,
                    transform: open ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 150ms ease-out",
                }}
            >
                <div className="px-5 py-4 md:px-7 md:py-5 flex items-center justify-between border-b-[0.5px] border-(--hairline)">
                    <div className="text-[16px] font-medium">
                        Write a review
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-0 text-steel cursor-pointer p-1"
                        aria-label="Close drawer"
                    >
                        <Icon name="x" size={18} />
                    </button>
                </div>
                <div className="p-5 md:p-7 flex-1 overflow-y-auto flex flex-col gap-6">
                    <div>
                        <div
                            className="text-micro text-steel mb-[10px]"
                            style={{ letterSpacing: "0.04em" }}
                        >
                            RATING
                        </div>
                        <Stars
                            value={rating}
                            size={22}
                            onChange={setRating}
                            idPrefix="drawer-rating"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={dateId}
                            className="block text-micro text-steel mb-[10px]"
                            style={{ letterSpacing: "0.04em" }}
                        >
                            LISTENED ON
                        </label>
                        <input
                            id={dateId}
                            placeholder="Today"
                            className="w-full px-3 py-[10px] bg-ink border-0 rounded-sm text-paper font-sans text-[14px] outline-none"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={reviewId}
                            className="block text-micro text-steel mb-[10px]"
                            style={{ letterSpacing: "0.04em" }}
                        >
                            REVIEW
                        </label>
                        <textarea
                            id={reviewId}
                            rows={12}
                            placeholder="What did you hear?"
                            className="w-full p-[14px] bg-ink border-0 rounded-sm text-paper font-serif text-[17px] outline-none resize-y"
                            style={{ lineHeight: 1.6 }}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={tagsId}
                            className="block text-micro text-steel mb-[10px]"
                            style={{ letterSpacing: "0.04em" }}
                        >
                            TAGS
                        </label>
                        <input
                            id={tagsId}
                            placeholder="Headphones, Grower"
                            className="w-full px-3 py-[10px] bg-ink border-0 rounded-sm text-paper font-sans text-[14px] outline-none"
                        />
                    </div>
                </div>
                <div className="px-5 py-4 md:px-7 border-t-[0.5px] border-(--hairline) flex justify-end gap-2.5">
                    <button
                        onClick={onClose}
                        className="px-4 py-[9px] rounded-sm bg-transparent text-paper text-caption font-medium cursor-pointer"
                        style={{
                            border: "0.5px solid rgba(107,107,107,0.5)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-[9px] rounded-sm bg-paper border-0 text-ink text-caption font-medium cursor-pointer"
                    >
                        Save draft
                    </button>
                </div>
            </div>
        </>
    );
}

async function fetchAlbumData(
    mbid: string,
): Promise<ReleaseGroupResponse | null> {
    const response = await fetch(
        new URL(`catalog/release-groups/${mbid}`, apiBaseUrl),
        { credentials: "include", cache: "no-store" },
    );
    if (response.status === 202) return null;
    if (!response.ok)
        throw new Error(`album fetch failed (${response.status})`);
    const payload = (await response.json()) as
        | ReleaseGroupResponse
        | PendingResponse;
    return "jobId" in payload ? null : payload;
}

export default function AlbumView({
    mbid,
    initialData,
    pending = false,
}: {
    mbid: string;
    initialData: ReleaseGroupResponse | null;
    pending?: boolean;
}) {
    const [data, setData] = useState<ReleaseGroupResponse | null>(initialData);
    const [isPending, setIsPending] = useState(pending);
    const [status, setStatus] = useState<StatusId>("backlog");
    const [userRating, setUserRating] = useState<number>(0);
    const [ratingOpen, setRatingOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const header = useMemo(
        () => (data ? headerFromResponse(data) : null),
        [data],
    );
    const metrics = useMemo(
        () => albumMetrics(data?.media ?? []),
        [data?.media],
    );

    useEffect(() => {
        if (data?.tracksStatus === "ready") return;

        let cancelled = false;
        const interval = window.setInterval(() => {
            void fetchAlbumData(mbid)
                .then((next) => {
                    if (cancelled) return;
                    if (next) {
                        setData(next);
                        setIsPending(false);
                    } else {
                        setIsPending(true);
                    }
                })
                .catch(() => {
                    if (!cancelled) setIsPending(false);
                });
        }, 2500);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [data?.tracksStatus, mbid]);

    useEffect(() => {
        if (!drawerOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [drawerOpen]);

    return (
        <>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
                {isPending && (
                    <div className="mt-6 rounded-sm border-[0.5px] border-(--hairline) bg-surface px-4 py-3 text-caption text-steel">
                        Album metadata is being fetched from MusicBrainz.
                    </div>
                )}

                <AlbumHeader
                    header={header}
                    data={data}
                    metrics={metrics}
                    status={status}
                    setStatus={setStatus}
                    userRating={userRating}
                    setUserRating={setUserRating}
                    ratingOpen={ratingOpen}
                    setRatingOpen={setRatingOpen}
                    onWriteReview={() => setDrawerOpen(true)}
                />

                <PersonalStrip status={status} userRating={userRating} />

                <section className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 lg:gap-16 items-start">
                    {data ? (
                        <Tracklist
                            status={data.tracksStatus}
                            media={data.media}
                            metrics={metrics}
                        />
                    ) : (
                        <TracklistSkeleton />
                    )}
                    <Sidebar header={header} />
                </section>

                <div className="h-16 md:h-24" />
                <YourReview onWriteReview={() => setDrawerOpen(true)} />

                <div className="h-16 md:h-24" />
                <CommunityReviews />

                <div className="h-16 md:h-24" />
                <EditionsRow data={data} />

                <div className="h-16 md:h-24" />
                <RelatedSections header={header} currentMbid={mbid} />

                <div className="h-16 md:h-24" />
            </main>

            <ReviewDrawer
                open={drawerOpen}
                rating={userRating}
                setRating={setUserRating}
                onClose={() => setDrawerOpen(false)}
            />
        </>
    );
}

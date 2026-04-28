"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { apiBaseUrl } from "../../../../lib/config";
import { CoverArt, StatusGlyph } from "../../_components/primitives";
import type { StatusId } from "../../release-groups/[mbid]/album-data";
import {
    MOCK_BY_DECADE,
    MOCK_RATING_DISTRIBUTION,
    MOCK_STATUS_BREAKDOWN,
    MOCK_TOP_ARTISTS,
    MOCK_TOP_GENRES,
} from "./profile-data";
import type {
    ProfileLibraryItem,
    ProfileReviewItem,
    ProfileTrackItem,
} from "./profile-view";

type AlbumSortKey = "recent" | "rating" | "year" | "title";

const STATUS_FILTERS: Array<{ id: StatusId | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "loved", label: "Loved" },
    { id: "listened", label: "Listened" },
    { id: "backlog", label: "Backlog" },
    { id: "shelved", label: "Shelved" },
];

function compareAlbums(
    a: ProfileLibraryItem,
    b: ProfileLibraryItem,
    key: AlbumSortKey,
) {
    switch (key) {
        case "rating":
            return (b.rating ?? -1) - (a.rating ?? -1);
        case "year":
            return (b.releaseGroup.year ?? 0) - (a.releaseGroup.year ?? 0);
        case "title":
            return a.releaseGroup.title.localeCompare(b.releaseGroup.title);
        case "recent":
        default:
            return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            );
    }
}

function MockBadge() {
    return (
        <span
            className="inline-block text-micro uppercase text-steel"
            style={{ letterSpacing: "0.16em" }}
            title="Mock data — not yet wired to real library"
        >
            Mock
        </span>
    );
}

function LibraryCover({
    item,
    size = 40,
}: {
    item: ProfileLibraryItem;
    size?: number;
}) {
    const releaseGroup = item.releaseGroup;
    return (
        <CoverArt
            src={releaseGroup.coverArtUrl}
            title={releaseGroup.title}
            seed={releaseGroup.mbid ?? item.id}
            size={size}
            radius={4}
        />
    );
}

export function AlbumListTab({ items }: { items: ProfileLibraryItem[] }) {
    const [statusFilter, setStatusFilter] = useState<StatusId | "all">("all");
    const [sort, setSort] = useState<AlbumSortKey>("recent");

    const visible = useMemo(() => {
        const filtered =
            statusFilter === "all"
                ? items
                : items.filter((a) => a.status === statusFilter);
        const sorted = [...filtered].sort((a, b) => compareAlbums(a, b, sort));
        return sorted;
    }, [items, statusFilter, sort]);

    return (
        <div className="mt-10 flex flex-col gap-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between md:gap-6">
                <div className="flex items-baseline gap-4">
                    <h2
                        className="text-h3 font-medium"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        Albums
                    </h2>
                    <span
                        className="text-caption text-steel"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {visible.length} of {items.length}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 md:hidden">
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as StatusId | "all")
                        }
                        aria-label="Album status"
                        className="min-w-0 rounded-sm border-[0.5px] border-(--hairline) bg-surface px-3 py-2 text-caption text-paper outline-none"
                    >
                        {STATUS_FILTERS.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value as AlbumSortKey)
                        }
                        aria-label="Album sort"
                        className="min-w-0 rounded-sm border-[0.5px] border-(--hairline) bg-surface px-3 py-2 text-caption text-paper outline-none"
                    >
                        <option value="recent">Most recent</option>
                        <option value="rating">Highest rated</option>
                        <option value="year">Year</option>
                        <option value="title">A to Z</option>
                    </select>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    {STATUS_FILTERS.map((f) => {
                        const active = statusFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium pb-0.5 transition-colors duration-120"
                                style={{
                                    color: active ? "#F7F7F7" : "#6B6B6B",
                                    borderBottom: active
                                        ? "1px solid #F7F7F7"
                                        : "1px solid transparent",
                                }}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                    <div className="h-4 w-px bg-(--hairline) mx-1" />
                    <select
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value as AlbumSortKey)
                        }
                        className="bg-transparent text-caption text-paper outline-none cursor-pointer"
                    >
                        <option value="recent">Most recent</option>
                        <option value="rating">Highest rated</option>
                        <option value="year">Year (new → old)</option>
                        <option value="title">A → Z</option>
                    </select>
                </div>
            </header>

            <div
                className="rounded-md border-[0.5px] border-(--hairline) bg-surface overflow-hidden"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                <div
                    className="hidden md:grid md:grid-cols-[44px_minmax(0,1fr)_64px_80px_28px_100px] items-center gap-4 px-5 py-2.5 text-micro font-medium uppercase text-steel border-b-[0.5px] border-(--hairline)"
                    style={{ letterSpacing: "0.08em" }}
                >
                    <div></div>
                    <div>Title</div>
                    <div className="text-right">Year</div>
                    <div className="text-right">Rating</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Listened</div>
                </div>
                {visible.map((album) => (
                    <div
                        key={album.id}
                        className="grid grid-cols-[44px_minmax(0,1fr)_48px] md:grid-cols-[44px_minmax(0,1fr)_64px_80px_28px_100px] items-center gap-3 md:gap-4 px-3 md:px-5 py-3 border-b-[0.5px] border-(--hairline) last:border-b-0 hover:bg-paper/3 transition-colors duration-120"
                    >
                        <LibraryCover item={album} />
                        <div className="min-w-0">
                            {album.releaseGroup.mbid ? (
                                <Link
                                    href={`/release-groups/${album.releaseGroup.mbid}`}
                                    className="block truncate text-body font-medium text-paper no-underline hover:underline"
                                >
                                    {album.releaseGroup.title}
                                </Link>
                            ) : (
                                <div className="truncate text-body font-medium text-paper">
                                    {album.releaseGroup.title}
                                </div>
                            )}
                            {album.releaseGroup.artistMbid ? (
                                <Link
                                    href={`/artists/${album.releaseGroup.artistMbid}`}
                                    className="block truncate text-caption text-steel no-underline hover:text-paper hover:underline"
                                >
                                    {album.releaseGroup.primaryArtistCredit}
                                </Link>
                            ) : (
                                <div className="truncate text-caption text-steel">
                                    {album.releaseGroup.primaryArtistCredit}
                                </div>
                            )}
                        </div>
                        <div className="hidden md:block text-right text-caption text-steel">
                            {album.releaseGroup.year ?? "--"}
                        </div>
                        <div className="text-right text-caption text-paper">
                            {album.rating !== null
                                ? album.rating.toFixed(1)
                                : "--"}
                        </div>
                        <div className="hidden md:flex justify-center text-paper">
                            <StatusGlyph
                                kind={album.status as StatusId}
                                size={13}
                            />
                        </div>
                        <div className="hidden md:block text-right text-caption text-steel truncate">
                            {album.listenedAt
                                ? new Date(
                                      album.listenedAt,
                                  ).toLocaleDateString()
                                : "--"}
                        </div>
                    </div>
                ))}
                {visible.length === 0 && (
                    <div className="px-4 py-8 text-center text-caption text-steel">
                        No albums yet.
                    </div>
                )}
            </div>
        </div>
    );
}

const TRACK_VIEWS = [
    { id: "100", label: "Top 100", limit: 100 },
    { id: "500", label: "Top 500", limit: 500 },
] as const;

function formatDuration(lengthMs: number | null): string {
    if (lengthMs === null) return "--:--";
    const totalSeconds = Math.round(lengthMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TrackListTab({ items }: { items: ProfileTrackItem[] }) {
    const [view, setView] = useState<(typeof TRACK_VIEWS)[number]["id"]>("100");
    const visible = items.slice(
        0,
        TRACK_VIEWS.find((option) => option.id === view)?.limit ?? 100,
    );

    return (
        <div className="mt-10 flex flex-col gap-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between md:gap-6">
                <div className="flex items-baseline gap-4">
                    <h2
                        className="text-h3 font-medium"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        Top tracks
                    </h2>
                    <span
                        className="text-caption text-steel"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        Showing {visible.length} of {items.length}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {TRACK_VIEWS.map((v) => {
                        const active = view === v.id;
                        return (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id)}
                                className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium pb-0.5 transition-colors duration-120"
                                style={{
                                    color: active ? "#F7F7F7" : "#6B6B6B",
                                    borderBottom: active
                                        ? "1px solid #F7F7F7"
                                        : "1px solid transparent",
                                }}
                            >
                                {v.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            <div
                className="rounded-md border-[0.5px] border-(--hairline) bg-surface overflow-hidden"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                <div
                    className="hidden md:grid md:grid-cols-[32px_minmax(0,2fr)_minmax(0,1.5fr)_64px_56px_56px] items-center gap-4 px-5 py-2.5 text-micro font-medium uppercase text-steel border-b-[0.5px] border-(--hairline)"
                    style={{ letterSpacing: "0.08em" }}
                >
                    <div className="text-right">#</div>
                    <div>Track</div>
                    <div>Album</div>
                    <div className="text-right">Year</div>
                    <div className="text-right">Time</div>
                    <div className="text-right">Rating</div>
                </div>
                {visible.map((track, index) => (
                    <div
                        key={track.id}
                        className="grid grid-cols-[32px_minmax(0,1fr)_48px] md:grid-cols-[32px_minmax(0,2fr)_minmax(0,1.5fr)_64px_56px_56px] items-center gap-3 md:gap-4 px-3 md:px-5 py-3 border-b-[0.5px] border-(--hairline) last:border-b-0 hover:bg-paper/3 transition-colors duration-120"
                    >
                        <div className="text-right text-caption text-steel">
                            {index + 1}
                        </div>
                        <div className="min-w-0">
                            <Link
                                href={`/tracks/${track.recordingMbid}`}
                                className="block truncate text-body font-medium text-paper no-underline hover:underline"
                            >
                                {track.title}
                            </Link>
                            <div className="truncate text-caption text-steel">
                                {track.releaseGroup.primaryArtistCredit}
                            </div>
                        </div>
                        <div className="hidden md:block min-w-0 truncate text-caption text-steel">
                            {track.releaseGroup.title}
                        </div>
                        <div className="hidden md:block text-right text-caption text-steel">
                            {track.releaseGroup.year ?? "--"}
                        </div>
                        <div className="hidden md:block text-right text-caption text-steel">
                            {formatDuration(track.lengthMs)}
                        </div>
                        <div className="text-right text-caption text-paper">
                            {track.rating.toFixed(1)}
                        </div>
                    </div>
                ))}
                {visible.length === 0 && (
                    <div className="px-4 py-8 text-center text-caption text-steel">
                        No rated tracks yet.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-md border-[0.5px] border-(--hairline) bg-surface p-5 md:p-6">
            <h3
                className="text-micro font-medium uppercase text-steel mb-4"
                style={{ letterSpacing: "0.08em" }}
            >
                {title}
            </h3>
            {children}
        </section>
    );
}

function HorizontalBars({
    items,
    valueKey,
    labelKey,
    accentKey,
}: {
    items: Array<Record<string, string | number>>;
    valueKey: string;
    labelKey: string;
    accentKey?: string;
}) {
    const max = Math.max(...items.map((i) => Number(i[valueKey])));
    return (
        <div className="flex flex-col gap-2.5">
            {items.map((item, i) => {
                const value = Number(item[valueKey]);
                const label = String(item[labelKey]);
                const accent = accentKey ? String(item[accentKey]) : null;
                const pct = (value / max) * 100;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-28 md:w-32 truncate text-caption text-paper">
                            {label}
                        </div>
                        <div
                            className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{ background: "rgba(247,247,247,0.06)" }}
                        >
                            <div
                                className="h-full bg-paper"
                                style={{
                                    width: `${pct}%`,
                                    opacity: 0.5 + (pct / 100) * 0.5,
                                }}
                            />
                        </div>
                        <div
                            className="w-14 text-right text-caption text-steel"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {value}
                            {accent ? ` · ${accent}` : ""}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function RatingHistogramFull() {
    const max = Math.max(...MOCK_RATING_DISTRIBUTION);
    return (
        <div>
            <div className="flex items-end gap-1 h-32">
                {MOCK_RATING_DISTRIBUTION.map((v, i) => {
                    const pct = (v / max) * 100;
                    return (
                        <div
                            key={i}
                            className="flex-1 bg-paper rounded-[1px]"
                            style={{
                                height: `${Math.max(4, pct)}%`,
                                opacity: 0.45 + (pct / 100) * 0.55,
                            }}
                        />
                    );
                })}
            </div>
            <div
                className="mt-2 flex justify-between text-micro text-steel"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                <span>0.5</span>
                <span>5</span>
                <span>10</span>
            </div>
        </div>
    );
}

function StatusBreakdownDonut() {
    const total = MOCK_STATUS_BREAKDOWN.reduce((s, x) => s + x.count, 0);
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
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
        <div className="flex items-center gap-6">
            <svg
                width="148"
                height="148"
                viewBox="0 0 148 148"
                className="shrink-0"
            >
                <circle
                    cx="74"
                    cy="74"
                    r={radius}
                    stroke="rgba(247,247,247,0.05)"
                    strokeWidth="14"
                    fill="none"
                />
                {MOCK_STATUS_BREAKDOWN.map((seg) => {
                    const length = (seg.count / total) * circumference;
                    const dashArray = `${length} ${circumference - length}`;
                    const dashOffset = -offset;
                    offset += length;
                    return (
                        <circle
                            key={seg.id}
                            cx="74"
                            cy="74"
                            r={radius}
                            stroke="#F7F7F7"
                            strokeOpacity={opacityFor(seg.id)}
                            strokeWidth="14"
                            fill="none"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 74 74)"
                        />
                    );
                })}
                <text
                    x="74"
                    y="78"
                    textAnchor="middle"
                    fill="#F7F7F7"
                    fontSize="22"
                    fontWeight="500"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {total}
                </text>
            </svg>
            <div className="flex flex-col gap-2">
                {MOCK_STATUS_BREAKDOWN.map((seg) => (
                    <div
                        key={seg.id}
                        className="flex items-center gap-2.5 text-caption"
                    >
                        <span
                            className="text-paper"
                            style={{ opacity: opacityFor(seg.id) }}
                        >
                            <StatusGlyph kind={seg.id} size={12} />
                        </span>
                        <span className="text-steel">{seg.label}</span>
                        <span
                            className="text-paper ml-auto"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {seg.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatsTab() {
    return (
        <div className="mt-10 flex flex-col gap-8">
            <header className="flex items-baseline justify-between">
                <h2
                    className="text-h3 font-medium"
                    style={{ letterSpacing: "-0.005em" }}
                >
                    Stats
                </h2>
                <MockBadge />
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatCard title="Rating distribution">
                    <RatingHistogramFull />
                </StatCard>
                <StatCard title="By status">
                    <StatusBreakdownDonut />
                </StatCard>
                <StatCard title="Top artists">
                    <HorizontalBars
                        items={
                            MOCK_TOP_ARTISTS as unknown as Array<
                                Record<string, string | number>
                            >
                        }
                        labelKey="name"
                        valueKey="count"
                        accentKey="avg"
                    />
                </StatCard>
                <StatCard title="By decade">
                    <HorizontalBars
                        items={
                            MOCK_BY_DECADE as unknown as Array<
                                Record<string, string | number>
                            >
                        }
                        labelKey="decade"
                        valueKey="count"
                    />
                </StatCard>
                <StatCard title="Top genres">
                    <HorizontalBars
                        items={
                            MOCK_TOP_GENRES as unknown as Array<
                                Record<string, string | number>
                            >
                        }
                        labelKey="name"
                        valueKey="count"
                    />
                </StatCard>
            </div>
        </div>
    );
}

const REVIEW_SORTS = [
    { id: "recent", label: "Most recent" },
    { id: "highest", label: "Highest rated" },
    { id: "longest", label: "Longest" },
] as const;
type ReviewSortKey = (typeof REVIEW_SORTS)[number]["id"];

function parseRatingDraft(value: string): number | null {
    const rating = Number(value.trim().replace(",", "."));
    if (!Number.isFinite(rating)) return null;
    return Math.max(0, Math.min(10, Math.round(rating * 10) / 10));
}

async function updateReview(
    id: string,
    body: { rating: number; body: string; tags: string[] },
) {
    const response = await fetch(
        new URL(`users/me/reviews/${id}`, apiBaseUrl),
        {
            method: "PATCH",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        },
    );
    if (!response.ok)
        throw new Error(`review update failed (${response.status})`);
    return (await response.json()) as ProfileReviewItem;
}

async function deleteReview(id: string) {
    const response = await fetch(
        new URL(`users/me/reviews/${id}`, apiBaseUrl),
        {
            method: "DELETE",
            credentials: "include",
        },
    );
    if (!response.ok)
        throw new Error(`review delete failed (${response.status})`);
}

export function ReviewsTab({
    initialItems,
    canManage,
}: {
    initialItems: ProfileReviewItem[];
    canManage: boolean;
}) {
    const [sort, setSort] = useState<ReviewSortKey>("recent");
    const [items, setItems] = useState(initialItems);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftRating, setDraftRating] = useState("");
    const [draftBody, setDraftBody] = useState("");
    const [draftTags, setDraftTags] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);

    const sorted = useMemo(() => {
        const list = [...items];
        switch (sort) {
            case "highest":
                list.sort((a, b) => b.rating - a.rating);
                break;
            case "longest":
                list.sort((a, b) => b.body.length - a.body.length);
                break;
            case "recent":
            default:
                list.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
                break;
        }
        return list;
    }, [items, sort]);

    function startEdit(review: ProfileReviewItem) {
        setEditingId(review.id);
        setDraftRating(review.rating.toFixed(1));
        setDraftBody(review.body);
        setDraftTags(review.tags.join(", "));
    }

    function saveEdit(review: ProfileReviewItem) {
        const rating = parseRatingDraft(draftRating);
        if (rating === null || savingId) return;
        setSavingId(review.id);
        void updateReview(review.id, {
            rating,
            body: draftBody.trim(),
            tags: draftTags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
        })
            .then((updated) => {
                setItems((current) =>
                    current.map((item) =>
                        item.id === updated.id ? updated : item,
                    ),
                );
                setEditingId(null);
            })
            .catch(() => {})
            .finally(() => setSavingId(null));
    }

    function removeReview(review: ProfileReviewItem) {
        const previous = items;
        setItems((current) => current.filter((item) => item.id !== review.id));
        void deleteReview(review.id).catch(() => setItems(previous));
    }

    return (
        <div className="mt-10 flex flex-col gap-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between md:gap-6">
                <div className="flex items-baseline gap-4">
                    <h2
                        className="text-h3 font-medium"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        Reviews
                    </h2>
                    <span
                        className="text-caption text-steel"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {sorted.length}
                    </span>
                </div>
                <div className="flex items-center gap-4 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto h-scroll">
                    {REVIEW_SORTS.map((s) => {
                        const active = sort === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSort(s.id)}
                                className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium pb-0.5 transition-colors duration-120"
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
            </header>

            <div className="flex flex-col gap-6">
                {sorted.map((review) => (
                    <article
                        key={review.id}
                        className="rounded-md border-[0.5px] border-(--hairline) bg-surface p-5 md:p-6"
                    >
                        <div className="flex items-start gap-4">
                            <CoverArt
                                src={review.releaseGroup.coverArtUrl}
                                title={review.releaseGroup.title}
                                seed={review.releaseGroup.mbid ?? review.id}
                                size={56}
                                radius={6}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-4">
                                    <div className="min-w-0">
                                        {review.releaseGroup.mbid ? (
                                            <Link
                                                href={`/release-groups/${review.releaseGroup.mbid}`}
                                                className="block truncate text-body font-medium text-paper no-underline hover:underline"
                                            >
                                                {review.releaseGroup.title}
                                            </Link>
                                        ) : (
                                            <div className="truncate text-body font-medium text-paper">
                                                {review.releaseGroup.title}
                                            </div>
                                        )}
                                        <div
                                            className="truncate text-caption text-steel"
                                            style={{
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {review.releaseGroup.artistMbid ? (
                                                <Link
                                                    href={`/artists/${review.releaseGroup.artistMbid}`}
                                                    className="text-steel no-underline hover:text-paper hover:underline"
                                                >
                                                    {
                                                        review.releaseGroup
                                                            .primaryArtistCredit
                                                    }
                                                </Link>
                                            ) : (
                                                review.releaseGroup
                                                    .primaryArtistCredit
                                            )}
                                            {review.releaseGroup.year
                                                ? ` · ${review.releaseGroup.year}`
                                                : ""}
                                        </div>
                                    </div>
                                    <div
                                        className="shrink-0 text-caption text-steel"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {new Date(
                                            review.createdAt,
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <span
                                        className="text-caption font-medium text-paper"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {review.rating.toFixed(1)}/10
                                    </span>
                                    {canManage && (
                                        <div className="flex items-center gap-3 text-caption">
                                            <button
                                                onClick={() =>
                                                    startEdit(review)
                                                }
                                                className="bg-transparent border-0 p-0 text-steel cursor-pointer hover:text-paper"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    removeReview(review)
                                                }
                                                className="bg-transparent border-0 p-0 text-steel cursor-pointer hover:text-paper"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {editingId === review.id ? (
                            <div className="mt-5 flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={draftRating}
                                        onChange={(event) =>
                                            setDraftRating(event.target.value)
                                        }
                                        type="text"
                                        inputMode="decimal"
                                        className="w-24 rounded-sm border-[0.5px] border-(--hairline) bg-ink px-3 py-2 text-caption text-paper outline-none"
                                    />
                                    <span className="text-caption text-steel">
                                        /10
                                    </span>
                                </div>
                                <textarea
                                    rows={7}
                                    value={draftBody}
                                    onChange={(event) =>
                                        setDraftBody(event.target.value)
                                    }
                                    className="w-full rounded-sm border-0 bg-ink p-3 font-serif text-[16px] text-paper outline-none"
                                    style={{ lineHeight: 1.6 }}
                                />
                                <input
                                    value={draftTags}
                                    onChange={(event) =>
                                        setDraftTags(event.target.value)
                                    }
                                    placeholder="Tags"
                                    className="w-full rounded-sm border-0 bg-ink px-3 py-2 text-caption text-paper outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="px-4 py-2 rounded-sm bg-transparent text-caption text-paper cursor-pointer"
                                        style={{
                                            border: "0.5px solid rgba(107,107,107,0.5)",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => saveEdit(review)}
                                        disabled={savingId === review.id}
                                        className="px-4 py-2 rounded-sm bg-paper border-0 text-caption font-medium text-ink cursor-pointer disabled:opacity-50"
                                    >
                                        {savingId === review.id
                                            ? "Saving..."
                                            : "Save"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {review.body.trim() && (
                                    <p
                                        className="mt-4 font-serif text-[16px] text-paper whitespace-pre-line"
                                        style={{ lineHeight: 1.6 }}
                                    >
                                        {review.body}
                                    </p>
                                )}
                                {review.tags.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {review.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-block px-2.5 py-1 text-[12px] rounded-sm text-paper"
                                                style={{
                                                    background: "#262626",
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </article>
                ))}
                {sorted.length === 0 && (
                    <div className="rounded-md border-[0.5px] border-(--hairline) bg-surface px-4 py-8 text-caption text-steel text-center">
                        No reviews yet.
                    </div>
                )}
            </div>
        </div>
    );
}

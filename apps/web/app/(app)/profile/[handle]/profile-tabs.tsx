"use client";

import { useMemo, useState } from "react";
import {
    GenericCover,
    StatusGlyph,
    Stars,
} from "../../_components/primitives";
import type { StatusId } from "../../release-groups/[mbid]/album-data";
import {
    MOCK_ALBUM_LIST,
    MOCK_BY_DECADE,
    MOCK_RATING_DISTRIBUTION,
    MOCK_REVIEWS,
    MOCK_STATUS_BREAKDOWN,
    MOCK_TOP_ARTISTS,
    MOCK_TOP_GENRES,
    MOCK_TOP_TRACKS,
    type AlbumListEntry,
} from "./profile-data";

type AlbumSortKey = "recent" | "rating" | "year" | "title";

const STATUS_FILTERS: Array<{ id: StatusId | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "loved", label: "Loved" },
    { id: "listened", label: "Listened" },
    { id: "backlog", label: "Backlog" },
    { id: "shelved", label: "Shelved" },
];

function compareAlbums(a: AlbumListEntry, b: AlbumListEntry, key: AlbumSortKey) {
    switch (key) {
        case "rating":
            return b.rating - a.rating;
        case "year":
            return b.year - a.year;
        case "title":
            return a.title.localeCompare(b.title);
        case "recent":
        default:
            return 0;
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

export function AlbumListTab() {
    const [statusFilter, setStatusFilter] = useState<StatusId | "all">("all");
    const [sort, setSort] = useState<AlbumSortKey>("recent");

    const visible = useMemo(() => {
        const filtered =
            statusFilter === "all"
                ? MOCK_ALBUM_LIST
                : MOCK_ALBUM_LIST.filter((a) => a.status === statusFilter);
        const sorted = [...filtered].sort((a, b) =>
            compareAlbums(a, b, sort),
        );
        return sorted;
    }, [statusFilter, sort]);

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
                        {visible.length} of {MOCK_ALBUM_LIST.length}
                    </span>
                    <MockBadge />
                </div>
                <div className="flex items-center gap-4 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto h-scroll">
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
                    <div className="shrink-0 h-4 w-px bg-(--hairline) mx-1" />
                    <select
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value as AlbumSortKey)
                        }
                        className="shrink-0 bg-transparent text-caption text-paper outline-none cursor-pointer"
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
                    className="grid items-center gap-4 px-4 md:px-5 py-2.5 text-micro font-medium uppercase text-steel border-b-[0.5px] border-(--hairline)"
                    style={{
                        letterSpacing: "0.08em",
                        gridTemplateColumns:
                            "44px minmax(0, 1fr) 64px 80px 28px 100px",
                    }}
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
                        className="grid items-center gap-4 px-4 md:px-5 py-3 border-b-[0.5px] border-(--hairline) last:border-b-0 hover:bg-paper/3 transition-colors duration-120"
                        style={{
                            gridTemplateColumns:
                                "44px minmax(0, 1fr) 64px 80px 28px 100px",
                        }}
                    >
                        <GenericCover
                            size={40}
                            radius={4}
                            palette={album.palette}
                            label={album.letter}
                        />
                        <div className="min-w-0">
                            <div className="truncate text-body font-medium text-paper">
                                {album.title}
                            </div>
                            <div className="truncate text-caption text-steel">
                                {album.artist}
                            </div>
                        </div>
                        <div className="text-right text-caption text-steel">
                            {album.year}
                        </div>
                        <div className="text-right text-caption text-paper">
                            {album.rating.toFixed(1)}
                        </div>
                        <div className="flex justify-center text-paper">
                            <StatusGlyph kind={album.status} size={13} />
                        </div>
                        <div className="text-right text-caption text-steel truncate">
                            {album.listenedOn}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const TRACK_VIEWS = [
    { id: "100", label: "Top 100", limit: 100 },
    { id: "500", label: "Top 500", limit: 500 },
] as const;

export function TrackListTab() {
    const [view, setView] = useState<(typeof TRACK_VIEWS)[number]["id"]>("100");
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
                        Showing {MOCK_TOP_TRACKS.length} of{" "}
                        {view === "100" ? 100 : 500}
                    </span>
                    <MockBadge />
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
                    className="grid items-center gap-4 px-4 md:px-5 py-2.5 text-micro font-medium uppercase text-steel border-b-[0.5px] border-(--hairline)"
                    style={{
                        letterSpacing: "0.08em",
                        gridTemplateColumns:
                            "32px minmax(0, 2fr) minmax(0, 1.5fr) 64px 56px 56px",
                    }}
                >
                    <div className="text-right">#</div>
                    <div>Track</div>
                    <div>Album</div>
                    <div className="text-right">Year</div>
                    <div className="text-right">Time</div>
                    <div className="text-right">Rating</div>
                </div>
                {MOCK_TOP_TRACKS.map((track) => (
                    <div
                        key={track.rank}
                        className="grid items-center gap-4 px-4 md:px-5 py-3 border-b-[0.5px] border-(--hairline) last:border-b-0 hover:bg-paper/3 transition-colors duration-120"
                        style={{
                            gridTemplateColumns:
                                "32px minmax(0, 2fr) minmax(0, 1.5fr) 64px 56px 56px",
                        }}
                    >
                        <div className="text-right text-caption text-steel">
                            {track.rank}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-body font-medium text-paper">
                                {track.title}
                            </div>
                            <div className="truncate text-caption text-steel">
                                {track.artist}
                            </div>
                        </div>
                        <div className="min-w-0 truncate text-caption text-steel">
                            {track.album}
                        </div>
                        <div className="text-right text-caption text-steel">
                            {track.year}
                        </div>
                        <div className="text-right text-caption text-steel">
                            {track.runtime}
                        </div>
                        <div className="text-right text-caption text-paper">
                            {track.rating.toFixed(1)}
                        </div>
                    </div>
                ))}
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
    { id: "helpful", label: "Most helpful" },
] as const;
type ReviewSortKey = (typeof REVIEW_SORTS)[number]["id"];

export function ReviewsTab() {
    const [sort, setSort] = useState<ReviewSortKey>("recent");

    const sorted = useMemo(() => {
        const list = [...MOCK_REVIEWS];
        switch (sort) {
            case "highest":
                list.sort((a, b) => b.rating - a.rating);
                break;
            case "longest":
                list.sort((a, b) => b.body.length - a.body.length);
                break;
            case "helpful":
                list.sort((a, b) => b.helpful - a.helpful);
                break;
            case "recent":
            default:
                break;
        }
        return list;
    }, [sort]);

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
                    <MockBadge />
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
                            <GenericCover
                                size={56}
                                radius={6}
                                palette={review.palette}
                                label={review.letter}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="truncate text-body font-medium text-paper">
                                            {review.target}
                                        </div>
                                        <div
                                            className="truncate text-caption text-steel"
                                            style={{
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {review.artist} · {review.year}
                                        </div>
                                    </div>
                                    <div
                                        className="shrink-0 text-caption text-steel"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {review.date}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <Stars
                                        value={review.rating}
                                        size={12}
                                        idPrefix={`profile-review-${review.id}`}
                                    />
                                    <span
                                        className="text-caption font-medium text-paper"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {review.rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p
                            className="mt-4 font-serif text-[16px] text-paper whitespace-pre-line"
                            style={{ lineHeight: 1.6 }}
                        >
                            {review.body}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                                {review.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-block px-2.5 py-1 text-[12px] rounded-sm text-paper"
                                        style={{ background: "#262626" }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div
                                className="text-[12px] text-steel"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {review.helpful} found this helpful
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

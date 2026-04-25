"use client";

import {
    Fragment,
    type CSSProperties,
    useEffect,
    useId,
    useState,
} from "react";
import {
    ALBUM,
    ALSO_LIKED,
    ARCHIVED_REVIEWS,
    COMMUNITY_REVIEWS,
    EDITIONS,
    MORE_FROM_ARTIST,
    PERSONAL,
    STATUSES,
    type StatusId,
    TRACKS,
    type Track,
    YOUR_REVIEW,
    type CommunityReview,
    type Edition,
    type RelatedItem,
} from "./album-data";
import {
    GenericCover,
    Icon,
    RatingHistogram,
    Stars,
    StatusGlyph,
} from "../../_components/primitives";
import { InRainbowsCover } from "./album-primitives";

export type AlbumHeaderData = {
    title: string;
    artist: string;
    artistMbid: string | null;
    year: number | null;
    type: string;
    secondaryTypes: string[];
    coverArtUrl: string | null;
};

type ActionBtnProps = {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
};

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

    if (header && header.title.toLowerCase() !== "in rainbows") {
        const letter = header.title.trim()[0]?.toUpperCase() ?? "?";
        return (
            <GenericCover
                className={className}
                radius={radius}
                palette={["#1a1a1a", "#2e2e2e", "#4a4a4a"]}
                label={letter}
            />
        );
    }

    return <InRainbowsCover className={className} radius={radius} />;
}

function ActionBtn({ active = false, onClick, children }: ActionBtnProps) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 px-[14px] py-[9px] rounded-sm bg-transparent text-paper text-caption font-medium cursor-pointer transition-[border-color,opacity] duration-120"
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
    status,
    setStatus,
    userRating,
    setUserRating,
    ratingOpen,
    setRatingOpen,
    onWriteReview,
    onLogRevisit,
    onOwn,
    hasReviewed,
    showHistogram,
}: {
    header: AlbumHeaderData | null;
    status: StatusId;
    setStatus: (s: StatusId) => void;
    userRating: number;
    setUserRating: (v: number) => void;
    ratingOpen: boolean;
    setRatingOpen: (v: boolean) => void;
    onWriteReview: () => void;
    onLogRevisit: () => void;
    onOwn: () => void;
    hasReviewed: boolean;
    showHistogram: boolean;
}) {
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const currentStatus = STATUSES.find((s) => s.id === status)!;

    const title = header?.title ?? ALBUM.title;
    const artistName = header?.artist ?? ALBUM.artist;
    const artistHref = header?.artistMbid
        ? `/artists/${header.artistMbid}`
        : "#";
    const year = header?.year ?? ALBUM.year;
    const typeLabel = header?.type ?? ALBUM.type;
    const secondaryTypes = header?.secondaryTypes ?? [];

    return (
        <section className="pt-8 md:pt-16">
            <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[320px_1fr] gap-6 md:gap-8 lg:gap-12 items-start">
                <AlbumCover
                    header={header}
                    className="w-full max-w-60 sm:max-w-70 md:max-w-[320px] aspect-square mx-auto md:mx-0"
                    radius={12}
                />

                <div className="pt-1 w-full min-w-0">
                    <a
                        href={artistHref}
                        className="text-[16px] md:text-h3 font-normal text-paper no-underline"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        {artistName}
                    </a>

                    <h1
                        className="text-[32px] sm:text-[44px] md:text-display font-medium text-paper mt-1.5 wrap-break-word"
                        style={{
                            lineHeight: 1.02,
                            letterSpacing: "-0.02em",
                            margin: "6px 0 0",
                        }}
                    >
                        {title}
                    </h1>

                    <div
                        className="mt-[18px] text-caption text-steel"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {year !== null && (
                            <>
                                <span className="whitespace-nowrap">
                                    {year}
                                </span>
                                <span> · </span>
                            </>
                        )}
                        <span className="whitespace-nowrap">{typeLabel}</span>
                        {secondaryTypes.map((t) => (
                            <Fragment key={t}>
                                <span> · </span>
                                <span className="whitespace-nowrap">{t}</span>
                            </Fragment>
                        ))}
                        <span> · </span>
                        <span
                            className="whitespace-nowrap"
                            title="Mock data — not yet in DB"
                        >
                            {ALBUM.tracks} tracks
                        </span>
                        <span> · </span>
                        <span
                            className="whitespace-nowrap"
                            title="Mock data — not yet in DB"
                        >
                            {ALBUM.runtime}
                        </span>
                        <span> · </span>
                        <a
                            href="#"
                            className="text-steel no-underline whitespace-nowrap border-b-[0.5px] border-(--hairline) pb-[1px]"
                            title="Mock data — not yet in DB"
                        >
                            {ALBUM.genre}
                        </a>
                    </div>
                    <div className="mt-[6px] text-caption text-steel">
                        <a
                            href="#"
                            className="text-steel no-underline whitespace-nowrap"
                            title="Mock data — not yet in DB"
                        >
                            {ALBUM.label}
                        </a>
                        <span> · </span>
                        <span
                            className="whitespace-nowrap"
                            title="Mock data — not yet in DB"
                        >
                            {ALBUM.country}
                        </span>
                    </div>

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
                                {ALBUM.communityScore.toFixed(1)}
                            </div>
                            <div
                                className="text-caption text-steel mt-2"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                based on {ALBUM.ratingsCount.toLocaleString()}{" "}
                                ratings
                            </div>
                        </div>
                        {showHistogram && (
                            <div className="w-full max-w-65 pb-1.5">
                                <div
                                    className="text-micro font-medium text-steel mb-2"
                                    style={{ letterSpacing: "0.04em" }}
                                >
                                    Distribution
                                </div>
                                <div className="bg-surface px-2.5 py-2 rounded-sm">
                                    <RatingHistogram
                                        buckets={ALBUM.histogram}
                                        height={36}
                                    />
                                    <div
                                        className="flex justify-between mt-1.5 text-micro text-steel"
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        <span>0.5</span>
                                        <span>5</span>
                                        <span>10</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-9 flex flex-wrap gap-[10px] items-center">
                        <div className="relative">
                            <ActionBtn
                                active
                                onClick={() =>
                                    setStatusMenuOpen(!statusMenuOpen)
                                }
                            >
                                <span className="text-paper">
                                    <StatusGlyph kind={status} size={14} />
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
                                    style={{ top: "calc(100% + 6px)" }}
                                >
                                    {STATUSES.map((s) => (
                                        <StatusMenuItem
                                            key={s.id}
                                            id={s.id}
                                            label={s.label}
                                            active={s.id === status}
                                            onSelect={() => {
                                                setStatus(s.id);
                                                setStatusMenuOpen(false);
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

                        {hasReviewed && (
                            <ActionBtn onClick={onLogRevisit}>
                                <Icon name="rotate" size={14} />
                                <span>Log revisit</span>
                            </ActionBtn>
                        )}

                        <ActionBtn onClick={onOwn}>
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
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {userRating > 0 ? (
                                    `${userRating.toFixed(1)}/10`
                                ) : (
                                    <span className="text-steel">— / 10</span>
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
    const items: Array<{
        label: string;
        prefix?: string;
        icon?: React.ReactNode;
    }> = [
        {
            label: PERSONAL.statusLabel,
            icon: <StatusGlyph kind={status} size={13} />,
        },
        { label: `${userRating.toFixed(1)}/10`, prefix: "Your rating" },
        { label: PERSONAL.firstListened },
        { label: `${PERSONAL.revisits} reviews` },
        { label: PERSONAL.owns, icon: <Icon name="disc" size={13} /> },
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

function TrackRow({ track }: { track: Track }) {
    const [hover, setHover] = useState(false);
    const [you, setYou] = useState(track.you);
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
                {track.n}
            </div>
            <div className="text-[15px] text-paper min-w-0 truncate">
                {track.title}
            </div>
            <div className="hidden md:block">
                <Stars
                    value={you}
                    max={10}
                    size={11}
                    onChange={setYou}
                    idPrefix={`track-${track.n}`}
                />
            </div>
            <div
                className="text-caption text-steel text-right"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {track.comm.toFixed(1)}
            </div>
            <div
                className="text-caption text-steel text-right"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {track.dur}
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

function Tracklist() {
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
            {TRACKS.map((t) => (
                <TrackRow key={t.n} track={t} />
            ))}
            <div
                className="mt-[14px] pt-[14px] border-t-[0.5px] border-(--hairline) flex justify-between text-caption text-steel"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                <span>{ALBUM.tracks} tracks</span>
                <span>{ALBUM.runtime}</span>
            </div>
        </div>
    );
}

const creditLinkClass =
    "text-paper no-underline border-b-[0.5px] border-(--hairline) pb-[1px]";

function Sidebar() {
    return (
        <aside className="flex flex-col gap-10">
            <div>
                <h3
                    className="text-micro font-medium text-steel mb-4"
                    style={{ letterSpacing: "0.04em" }}
                >
                    Credits
                </h3>
                <div
                    className="grid text-caption"
                    style={{
                        gridTemplateColumns: "90px 1fr",
                        rowGap: 10,
                        columnGap: 16,
                    }}
                >
                    <div className="text-steel">Produced by</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            Nigel Godrich
                        </a>
                        ,{" "}
                        <a href="#" className={creditLinkClass}>
                            Radiohead
                        </a>
                    </div>
                    <div className="text-steel">Engineered</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            Nigel Godrich
                        </a>
                        ,{" "}
                        <a href="#" className={creditLinkClass}>
                            Hugo Nicolson
                        </a>
                    </div>
                    <div className="text-steel">Mixed by</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            Nigel Godrich
                        </a>
                    </div>
                    <div className="text-steel">Mastered by</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            Bob Ludwig
                        </a>
                    </div>
                    <div className="text-steel">Arrangements</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            Jonny Greenwood
                        </a>
                    </div>
                    <div className="text-steel">Strings</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            The Millennia Ensemble
                        </a>
                    </div>
                    <div className="text-steel">Artwork</div>
                    <div>
                        <a href="#" className={creditLinkClass}>
                            Stanley Donwood
                        </a>
                        ,{" "}
                        <a href="#" className={creditLinkClass}>
                            Thom Yorke
                        </a>
                    </div>
                </div>
            </div>

            <div>
                <h3
                    className="text-micro font-medium text-steel mb-4"
                    style={{ letterSpacing: "0.04em" }}
                >
                    Appears on
                </h3>
                <div className="flex flex-col gap-[14px] text-caption">
                    <div>
                        <a href="#" className="text-paper no-underline">
                            Autumn, slowly
                        </a>
                        <div className="text-steel mt-[2px]">
                            by priya.shah · 48 albums
                        </div>
                    </div>
                    <div>
                        <a href="#" className="text-paper no-underline">
                            Records I revisit every year
                        </a>
                        <div className="text-steel mt-[2px]">
                            by mrinehart · 24 albums
                        </div>
                    </div>
                    <div>
                        <a href="#" className="text-paper no-underline">
                            The case for the 2000s
                        </a>
                        <div className="text-steel mt-[2px]">
                            by hanabyrne · 60 albums
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

const pillClass =
    "inline-block px-[10px] py-1 text-[12px] rounded-sm text-paper";
const pillStyle: CSSProperties = { background: "#262626" };

function YourReview() {
    const [open, setOpen] = useState(false);
    return (
        <section>
            <h2 className="text-[20px] font-medium mb-5">Your review</h2>

            <article className="bg-surface rounded-md p-6 md:p-8">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <div
                            className="text-[40px] font-medium text-paper"
                            style={{
                                lineHeight: 1,
                                letterSpacing: "-0.02em",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {YOUR_REVIEW.rating.toFixed(1)}
                        </div>
                        <div className="mt-2">
                            <Stars
                                value={YOUR_REVIEW.rating}
                                size={12}
                                idPrefix="your-review"
                            />
                        </div>
                    </div>
                    <div
                        className="text-caption text-steel text-right"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        Listened on
                        <br />
                        <span className="text-paper">{YOUR_REVIEW.date}</span>
                    </div>
                </div>

                <div
                    className="font-serif text-[17px] text-paper mt-6 whitespace-pre-line"
                    style={{ lineHeight: 1.6, maxWidth: 620 }}
                >
                    {YOUR_REVIEW.body}
                </div>

                <div className="flex gap-2 mt-6 flex-wrap">
                    {YOUR_REVIEW.tags.map((t) => (
                        <span key={t} className={pillClass} style={pillStyle}>
                            {t}
                        </span>
                    ))}
                </div>
            </article>

            <HistoryToggle open={open} setOpen={setOpen} />

            {open && (
                <div className="mt-6 flex flex-col gap-7">
                    {ARCHIVED_REVIEWS.map((r, i) => (
                        <article
                            key={i}
                            className="pl-5 border-l-[0.5px] border-(--hairline)"
                        >
                            <div className="flex items-baseline gap-[14px] opacity-70">
                                <div
                                    className="text-[20px] font-medium text-paper"
                                    style={{
                                        lineHeight: 1,
                                        letterSpacing: "-0.01em",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {r.rating.toFixed(1)}
                                </div>
                                <Stars
                                    value={r.rating}
                                    size={11}
                                    idPrefix={`archive-${i}`}
                                />
                                <div className="flex-1" />
                                <div
                                    className="text-[12px] text-steel"
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {r.date}
                                </div>
                            </div>
                            <div
                                className="font-serif text-[17px] text-paper mt-3"
                                style={{ lineHeight: 1.6, maxWidth: 620 }}
                            >
                                {r.body}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function HistoryToggle({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
}) {
    const [hover, setHover] = useState(false);
    return (
        <button
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="mt-5 bg-transparent border-0 cursor-pointer inline-flex items-center gap-2 text-caption p-0"
            style={{ color: hover ? "#F7F7F7" : "#6B6B6B" }}
        >
            <span
                className="inline-flex"
                style={{
                    transform: open ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 120ms",
                }}
            >
                <Icon name="chev-right" size={13} />
            </span>
            Review history ({ARCHIVED_REVIEWS.length})
        </button>
    );
}

function CommunityReviewCard({ review }: { review: CommunityReview }) {
    const [expanded, setExpanded] = useState(false);
    const [readMoreHover, setReadMoreHover] = useState(false);
    const longBody = review.body.length > 260;
    const initials = review.name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("");
    return (
        <article className="flex flex-col">
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-paper text-[12px] font-medium shrink-0"
                    style={{ background: review.color }}
                >
                    {initials}
                </div>
                <div className="flex items-baseline gap-[10px] flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-paper">
                        {review.name}
                    </span>
                    <span className="text-caption text-steel">
                        {review.handle}
                    </span>
                </div>
                <div
                    className="text-caption text-steel"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {review.date}
                </div>
            </div>

            <div className="mt-[14px] flex items-center gap-3">
                <Stars
                    value={review.rating}
                    size={14}
                    idPrefix={`comm-${review.handle}`}
                />
                <span
                    className="text-[14px] text-paper font-medium"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {review.rating.toFixed(1)}
                </span>
            </div>

            <div
                className="font-serif text-[17px] text-paper mt-[14px] whitespace-pre-line relative"
                style={{
                    lineHeight: 1.6,
                    maxWidth: 620,
                    maxHeight: longBody && !expanded ? 130 : "none",
                    overflow: "hidden",
                }}
            >
                {review.body}
                {longBody && !expanded && (
                    <div
                        className="absolute bottom-0 left-0 right-0 pointer-events-none"
                        style={{
                            height: 60,
                            background:
                                "linear-gradient(to bottom, rgba(13,13,13,0), #0D0D0D)",
                        }}
                    />
                )}
            </div>
            {longBody && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    onMouseEnter={() => setReadMoreHover(true)}
                    onMouseLeave={() => setReadMoreHover(false)}
                    className="self-start mt-2 bg-transparent border-0 text-caption cursor-pointer p-0 border-b-[0.5px] border-(--hairline) pb-[1px]"
                    style={{ color: readMoreHover ? "#F7F7F7" : "#6B6B6B" }}
                >
                    {expanded ? "Read less" : "Read more"}
                </button>
            )}

            <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
                <div className="flex gap-2 flex-wrap">
                    {review.tags.map((t) => (
                        <span key={t} className={pillClass} style={pillStyle}>
                            {t}
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

            <div className="flex flex-col gap-12">
                {COMMUNITY_REVIEWS.map((r, i) => (
                    <CommunityReviewCard key={i} review={r} />
                ))}
            </div>

            <div className="mt-12 text-center">
                <a
                    href="#"
                    className="text-paper text-[14px] no-underline border-b-[0.5px] border-(--hairline) pb-[2px]"
                >
                    See all 847 reviews
                </a>
            </div>
        </section>
    );
}

function EditionCard({ edition }: { edition: Edition }) {
    const [hover, setHover] = useState(false);
    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="w-[172px] shrink-0 relative"
        >
            <div className="relative">
                <GenericCover
                    size={90}
                    radius={8}
                    palette={edition.palette}
                    label={edition.letter}
                />
                {edition.owned && (
                    <div
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                            width: 90,
                            height: 90,
                            borderRadius: 8,
                            boxShadow: "inset 0 0 0 1px rgba(247,247,247,0.15)",
                        }}
                    />
                )}
            </div>
            <div
                className="mt-3 text-[14px] text-paper font-medium"
                style={{ lineHeight: 1.3 }}
            >
                {edition.label}
            </div>
            <div
                className="mt-1 text-[12px] text-steel"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {edition.format} · {edition.country} · {edition.year}
            </div>
            {edition.owned ? (
                <div
                    className="mt-2 text-micro text-paper font-medium"
                    style={{ letterSpacing: "0.04em" }}
                >
                    OWNED
                </div>
            ) : (
                <button
                    className="mt-2 p-0 bg-transparent border-0 cursor-pointer text-[12px] transition-opacity duration-120 border-b-[0.5px] border-(--hairline)"
                    style={{
                        opacity: hover ? 1 : 0,
                        color: "#6B6B6B",
                    }}
                >
                    I own this
                </button>
            )}
        </div>
    );
}

function EditionsRow() {
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
                    {EDITIONS.length} known pressings
                </span>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-1 h-scroll">
                {EDITIONS.map((e, i) => (
                    <EditionCard key={i} edition={e} />
                ))}
            </div>
        </section>
    );
}

function RelatedCard({ item }: { item: RelatedItem }) {
    return (
        <a href="#" className="w-[160px] shrink-0 no-underline text-paper">
            <GenericCover
                size={160}
                radius={8}
                palette={item.palette}
                label={item.letter}
            />
            <div className="mt-3 text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                {item.title}
            </div>
            {item.artist && (
                <div className="mt-[2px] text-[12px] text-steel overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.artist}
                </div>
            )}
            <div
                className="mt-1 text-[12px] text-steel"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {item.year}
            </div>
        </a>
    );
}

function RelatedSections({ artistName }: { artistName: string }) {
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
                    <a
                        href="#"
                        className="text-steel text-caption no-underline"
                    >
                        Discography →
                    </a>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-1 h-scroll">
                    {MORE_FROM_ARTIST.map((it, i) => (
                        <RelatedCard key={i} item={it} />
                    ))}
                </div>
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
                        Based on listeners with a 9+ rating on this album.
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-1 h-scroll">
                    {ALSO_LIKED.map((it, i) => (
                        <RelatedCard key={i} item={it} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function ReviewDrawer({
    open,
    onClose,
}: {
    open: boolean;
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
                            value={9.5}
                            size={22}
                            onChange={() => {}}
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
                            defaultValue="18 April 2026"
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
                            placeholder="Autumn, Headphones, Grower…"
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
                        Post review
                    </button>
                </div>
            </div>
        </>
    );
}

export default function AlbumView({
    header,
    pending = false,
}: {
    header: AlbumHeaderData | null;
    pending?: boolean;
}) {
    const [status, setStatus] = useState<StatusId>("loved");
    const [userRating, setUserRating] = useState<number>(9.5);
    const [ratingOpen, setRatingOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
                {pending && (
                    <div className="mt-6 rounded-sm border-[0.5px] border-(--hairline) bg-surface px-4 py-3 text-caption text-steel">
                        This release group is still being seeded from
                        MusicBrainz. Refresh in a moment to see real metadata.
                    </div>
                )}
                <AlbumHeader
                    header={header}
                    status={status}
                    setStatus={setStatus}
                    userRating={userRating}
                    setUserRating={setUserRating}
                    ratingOpen={ratingOpen}
                    setRatingOpen={setRatingOpen}
                    onWriteReview={() => setDrawerOpen(true)}
                    onLogRevisit={() => setDrawerOpen(true)}
                    onOwn={() => {}}
                    hasReviewed
                    showHistogram
                />

                <PersonalStrip status={status} userRating={userRating} />

                <section className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 lg:gap-16 items-start">
                    <Tracklist />
                    <Sidebar />
                </section>

                <div className="h-16 md:h-24" />
                <YourReview />

                <div className="h-16 md:h-24" />
                <CommunityReviews />

                <div className="h-16 md:h-24" />
                <EditionsRow />

                <div className="h-16 md:h-24" />
                <RelatedSections artistName={header?.artist ?? ALBUM.artist} />

                <div className="h-16 md:h-24" />
            </main>

            <ReviewDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
        </>
    );
}

"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { apiBaseUrl } from "../../../../lib/config";
import { Avatar, CoverArt, Icon } from "../../_components/primitives";
import { type ActivityEntry, type ActivityKind } from "./profile-data";
import {
    AlbumListTab,
    ReviewsTab,
    StatsTab,
    TrackListTab,
} from "./profile-tabs";

export type PinnedReleaseGroup = {
    mbid: string;
    title: string;
    primaryArtistCredit: string;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
};

export type ProfileData = {
    handle: string;
    displayName: string;
    imageUrl: string | null;
    bio: string | null;
    location: string | null;
    isPrivate: boolean;
    joinedAt: string;
    isOwnProfile: boolean;
    privateProfile?: boolean;
    pinnedReleaseGroups: PinnedReleaseGroup[];
};

export type ProfileSummary = {
    libraryItems: number;
    albumsRated: number;
    reviews: number;
    distinctArtists: number;
    averageRating: number | null;
    owned: number;
    statusBreakdown: Record<string, number>;
};

export type ProfileActivityItem = {
    id: string;
    type: ActivityKind;
    rating: number | null;
    status: string | null;
    reviewId: string | null;
    createdAt: string;
    releaseGroup: {
        mbid: string | null;
        title: string;
        primaryArtistCredit: string;
        artistMbid: string | null;
        year: number | null;
        coverArtUrl: string | null;
    };
};

export type ProfileLibraryItem = {
    id: string;
    rating: number | null;
    status: string;
    owned: boolean;
    listenedAt: string | null;
    updatedAt: string;
    releaseGroup: ProfileActivityItem["releaseGroup"];
};

export type ProfileReviewItem = {
    id: string;
    rating: number;
    body: string;
    tags: string[];
    isMain: boolean;
    createdAt: string;
    updatedAt: string;
    releaseGroup: ProfileActivityItem["releaseGroup"];
};

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "albums", label: "Album List" },
    { id: "tracks", label: "Track List" },
    { id: "stats", label: "Stats" },
    { id: "reviews", label: "Reviews" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function yearOf(dateString: string | null): number | null {
    if (!dateString) return null;
    const y = Number(dateString.slice(0, 4));
    return Number.isFinite(y) ? y : null;
}

function formatJoinedAt(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });
}

function CoverTile({
    item,
    size,
    rounded = 8,
}: {
    item: PinnedReleaseGroup;
    size: number;
    rounded?: number;
}) {
    return (
        <CoverArt
            src={item.coverArtUrl}
            title={item.title}
            seed={item.mbid}
            size={size}
            radius={rounded}
        />
    );
}

function Banner({ profile }: { profile: ProfileData }) {
    const pins = profile.pinnedReleaseGroups;
    const first = pins[0];
    const [backgroundFailed, setBackgroundFailed] = useState(false);

    return (
        <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden border-b-[0.5px] border-(--hairline)">
            <div className="relative h-44 sm:h-56 md:h-64">
                {first?.coverArtUrl && !backgroundFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={first.coverArtUrl}
                        alt=""
                        aria-hidden="true"
                        onError={() => setBackgroundFailed(true)}
                        className="absolute inset-0 w-full h-full object-cover scale-110"
                        style={{ filter: "blur(60px) saturate(85%)" }}
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(circle at 30% 40%, #1a1a1a 0%, #0d0d0d 70%)",
                        }}
                    />
                )}

                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to bottom, rgba(13,13,13,0.35) 0%, rgba(13,13,13,0.55) 55%, #0D0D0D 100%)",
                    }}
                />

                {pins.length > 0 && (
                    <div className="absolute inset-y-0 right-0 hidden sm:flex items-center pr-6 md:pr-10">
                        <FannedCovers pins={pins} />
                    </div>
                )}

                {pins.length > 0 && (
                    <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 sm:hidden">
                        <MobilePins pins={pins} />
                    </div>
                )}
            </div>
        </section>
    );
}

function FannedCovers({ pins }: { pins: PinnedReleaseGroup[] }) {
    const visible = pins.slice(0, 4);
    const rotations = [-8, -3, 2, 6];
    const translates = [0, 24, 48, 72];
    const yOffsets = [14, 4, 4, 12];

    return (
        <div className="relative h-[168px] w-[320px] md:h-[196px] md:w-[380px]">
            {visible.map((pin, i) => {
                const rot = rotations[i] ?? 0;
                const tx = translates[i] ?? 0;
                const ty = yOffsets[i] ?? 0;
                return (
                    <Link
                        key={pin.mbid}
                        href={`/release-groups/${pin.mbid}`}
                        aria-label={`${pin.title} by ${pin.primaryArtistCredit}`}
                        className="absolute top-1/2 left-0 transition-transform duration-200 ease-out hover:-translate-y-2"
                        style={{
                            transform: `translate(${tx}px, calc(-50% + ${ty}px)) rotate(${rot}deg)`,
                            zIndex: i + 1,
                            filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))",
                        }}
                    >
                        <CoverTile item={pin} size={120} rounded={8} />
                    </Link>
                );
            })}
        </div>
    );
}

function MobilePins({ pins }: { pins: PinnedReleaseGroup[] }) {
    return (
        <div className="flex items-center gap-1.5">
            {pins.slice(0, 4).map((pin, i) => (
                <Link
                    key={pin.mbid}
                    href={`/release-groups/${pin.mbid}`}
                    className="block"
                    style={{
                        transform: `translateY(${i % 2 === 0 ? -4 : 4}px)`,
                        filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.45))",
                    }}
                >
                    <CoverTile item={pin} size={64} rounded={6} />
                </Link>
            ))}
        </div>
    );
}

function IdentityBar({
    profile,
    following,
    onToggleFollow,
}: {
    profile: ProfileData;
    following: boolean;
    onToggleFollow: () => void;
}) {
    const metaParts: string[] = [];
    if (profile.location) metaParts.push(profile.location);
    metaParts.push(`Joined ${formatJoinedAt(profile.joinedAt)}`);

    return (
        <section className="relative flex flex-col gap-6 pt-4 md:flex-row md:items-end md:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 flex-1 min-w-0">
                <div
                    className="-mt-16 md:-mt-20 shrink-0"
                    style={{
                        filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))",
                    }}
                >
                    <div
                        className="rounded-full"
                        style={{
                            boxShadow:
                                "0 0 0 4px #0D0D0D, 0 0 0 4.5px rgba(247,247,247,0.15)",
                        }}
                    >
                        <Avatar
                            imageUrl={profile.imageUrl}
                            name={profile.handle}
                            seed={profile.handle}
                            size={112}
                        />
                    </div>
                </div>
                <div className="min-w-0 flex-1 pt-3 sm:pt-0 sm:pb-1">
                    <h1
                        className="text-[32px] sm:text-h1 font-medium text-paper truncate"
                        style={{
                            letterSpacing: "-0.02em",
                            lineHeight: 1.05,
                        }}
                    >
                        {profile.handle}
                    </h1>
                    {metaParts.length > 0 && (
                        <div
                            className="mt-1.5 text-caption text-steel truncate"
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
                    {profile.bio && (
                        <p
                            className="mt-4 font-serif text-[16px] text-paper max-w-170 whitespace-pre-line"
                            style={{ lineHeight: 1.6 }}
                        >
                            {profile.bio}
                        </p>
                    )}
                </div>
            </div>

            <div className="shrink-0 flex items-center gap-2.5 md:pb-1">
                {profile.isOwnProfile ? (
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 px-3.5 py-2.25 rounded-sm bg-transparent text-paper text-caption font-medium no-underline transition-[border-color] duration-120"
                        style={{
                            border: "0.5px solid rgba(107,107,107,0.5)",
                        }}
                    >
                        <Icon name="edit" size={14} stroke={1.5} />
                        <span>Edit profile</span>
                    </Link>
                ) : (
                    <button
                        onClick={onToggleFollow}
                        className="inline-flex items-center gap-2 px-3.5 py-2.25 rounded-sm bg-transparent text-paper text-caption font-medium cursor-pointer transition-[border-color] duration-120"
                        style={{
                            border: `0.5px solid ${
                                following ? "#F7F7F7" : "rgba(107,107,107,0.5)"
                            }`,
                        }}
                    >
                        <Icon
                            name={following ? "check" : "plus"}
                            size={14}
                            stroke={1.5}
                        />
                        <span>{following ? "Following" : "Follow"}</span>
                    </button>
                )}
            </div>
        </section>
    );
}

function TabNav({
    tab,
    onChange,
}: {
    tab: TabId;
    onChange: (id: TabId) => void;
}) {
    return (
        <div className="mt-10 md:mt-14 -mx-4 sm:mx-0 px-4 sm:px-0 flex items-center gap-6 md:gap-8 overflow-x-auto h-scroll border-b-[0.5px] border-(--hairline)">
            {TABS.map((t) => {
                const active = t.id === tab;
                return (
                    <button
                        key={t.id}
                        onClick={() => onChange(t.id)}
                        className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium py-3 transition-colors duration-120"
                        style={{
                            color: active ? "#F7F7F7" : "#6B6B6B",
                            borderBottom: active
                                ? "1px solid #F7F7F7"
                                : "1px solid transparent",
                            marginBottom: "-1px",
                        }}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

function StatsOverview({ summary }: { summary: ProfileSummary | null }) {
    const items = [
        {
            label: "Albums rated",
            value: summary?.albumsRated.toLocaleString() ?? "0",
        },
        {
            label: "Reviews",
            value: summary?.reviews.toLocaleString() ?? "0",
        },
        {
            label: "Distinct artists",
            value: summary?.distinctArtists.toLocaleString() ?? "0",
        },
        {
            label: "Library",
            value: summary?.libraryItems.toLocaleString() ?? "0",
        },
        {
            label: "Avg rating",
            value: summary?.averageRating?.toFixed(1) ?? "--",
        },
        {
            label: "Owned",
            value: summary?.owned.toLocaleString() ?? "0",
        },
    ];
    return (
        <section>
            <h2
                className="text-h3 font-medium mb-5"
                style={{ letterSpacing: "-0.005em" }}
            >
                At a glance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-md border-[0.5px] border-(--hairline) bg-surface overflow-hidden">
                {items.map((item, i) => (
                    <div
                        key={item.label}
                        className="p-4 md:p-5"
                        style={{
                            borderRight:
                                i % 6 !== 5
                                    ? "0.5px solid rgba(107,107,107,0.15)"
                                    : "none",
                            borderBottom:
                                i < items.length - 3
                                    ? "0.5px solid rgba(107,107,107,0.15)"
                                    : "none",
                        }}
                    >
                        <div
                            className="text-micro font-medium text-steel uppercase"
                            style={{ letterSpacing: "0.08em" }}
                        >
                            {item.label}
                        </div>
                        <div
                            className="mt-2 text-h3 md:text-h2 font-medium text-paper"
                            style={{
                                fontVariantNumeric: "tabular-nums",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PinnedAlbums({
    pins,
    isOwnProfile,
}: {
    pins: PinnedReleaseGroup[];
    isOwnProfile: boolean;
}) {
    if (pins.length === 0) {
        return (
            <section>
                <div className="flex items-baseline justify-between mb-5">
                    <h2
                        className="text-h3 font-medium"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        Pinned albums
                    </h2>
                    {isOwnProfile && (
                        <Link
                            href="/settings"
                            className="text-caption text-steel no-underline"
                        >
                            Pin some →
                        </Link>
                    )}
                </div>
                <div className="rounded-md border-[0.5px] border-(--hairline) bg-surface px-4 py-8 text-caption text-steel text-center">
                    {isOwnProfile
                        ? "Pin up to four albums from Settings → Profile."
                        : "No pinned albums yet."}
                </div>
            </section>
        );
    }
    return (
        <section>
            <div className="flex items-baseline justify-between mb-5">
                <h2
                    className="text-h3 font-medium"
                    style={{ letterSpacing: "-0.005em" }}
                >
                    Pinned albums
                </h2>
                {isOwnProfile && (
                    <Link
                        href="/settings"
                        className="text-caption text-steel no-underline inline-flex items-center gap-1.5"
                    >
                        <Icon name="pin" size={13} stroke={1.5} />
                        Manage pins
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                {pins.slice(0, 4).map((pin) => (
                    <Link
                        key={pin.mbid}
                        href={`/release-groups/${pin.mbid}`}
                        className="no-underline text-paper"
                    >
                        <div className="aspect-square w-full">
                            <CoverTileFull item={pin} />
                        </div>
                        <div
                            className="mt-3 text-body font-medium text-paper truncate"
                            style={{ letterSpacing: "-0.005em" }}
                        >
                            {pin.title}
                        </div>
                        <div className="mt-0.5 text-caption text-steel truncate">
                            {pin.primaryArtistCredit}
                        </div>
                        {yearOf(pin.firstReleaseDate) !== null && (
                            <div
                                className="mt-0.5 text-micro text-steel"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {yearOf(pin.firstReleaseDate)}
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    );
}

function CoverTileFull({ item }: { item: PinnedReleaseGroup }) {
    return (
        <CoverArt
            src={item.coverArtUrl}
            title={item.title}
            seed={item.mbid}
            radius={8}
            className="w-full h-full"
        />
    );
}

const ACTIVITY_VERB: Record<ActivityKind, string> = {
    rated: "rated",
    reviewed: "reviewed",
    revisited: "revisited",
    loved: "loved",
    listened: "listened to",
    owned: "added to collection",
    unowned: "removed from collection",
    status_changed: "updated",
};

async function deleteActivity(id: string) {
    const response = await fetch(
        new URL(`users/me/activity/${id}`, apiBaseUrl),
        {
            method: "DELETE",
            credentials: "include",
        },
    );
    if (!response.ok)
        throw new Error(`activity delete failed (${response.status})`);
}

function ActivityItem({
    entry,
    canDelete,
    onDelete,
}: {
    entry: ActivityEntry;
    canDelete: boolean;
    onDelete: () => void;
}) {
    const albumHref = entry.albumMbid
        ? `/release-groups/${entry.albumMbid}`
        : null;
    const artistHref = entry.artistMbid ? `/artists/${entry.artistMbid}` : null;
    return (
        <article className="flex items-start gap-4 py-4 border-b-[0.5px] border-(--hairline) last:border-b-0">
            <div className="shrink-0 w-12 h-12 rounded-sm bg-surface flex items-center justify-center">
                <Icon
                    name={
                        entry.kind === "loved"
                            ? "check"
                            : entry.kind === "owned"
                              ? "disc"
                              : entry.kind === "reviewed"
                                ? "edit"
                                : entry.kind === "revisited"
                                  ? "rotate"
                                  : "check"
                    }
                    size={16}
                    stroke={1.5}
                />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-caption text-steel">
                    <span>{ACTIVITY_VERB[entry.kind]}</span>{" "}
                    {albumHref ? (
                        <Link
                            href={albumHref}
                            className="text-paper font-medium no-underline hover:underline"
                        >
                            {entry.target}
                        </Link>
                    ) : (
                        <span className="text-paper font-medium">
                            {entry.target}
                        </span>
                    )}{" "}
                    <span>by </span>
                    {artistHref ? (
                        <Link
                            href={artistHref}
                            className="text-steel no-underline hover:text-paper hover:underline"
                        >
                            {entry.artist}
                        </Link>
                    ) : (
                        <span>{entry.artist}</span>
                    )}
                    {entry.rating !== undefined && (
                        <>
                            {" · "}
                            <span
                                className="text-paper"
                                style={{
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {entry.rating.toFixed(1)}
                            </span>
                        </>
                    )}
                </div>
                {entry.snippet && (
                    <p
                        className="mt-2 font-serif text-[15px] text-paper max-w-170"
                        style={{ lineHeight: 1.5 }}
                    >
                        {entry.snippet}
                    </p>
                )}
            </div>
            <div
                className="shrink-0 text-micro text-steel pt-1"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {entry.date}
            </div>
            {canDelete && (
                <button
                    onClick={onDelete}
                    aria-label="Remove activity"
                    className="shrink-0 mt-0.5 bg-transparent border-0 text-steel cursor-pointer p-1 transition-colors duration-120 hover:text-paper"
                >
                    <Icon name="x" size={14} stroke={1.5} />
                </button>
            )}
        </article>
    );
}

function toActivityEntry(item: ProfileActivityItem): ActivityEntry {
    return {
        kind: item.type,
        target: item.releaseGroup.title,
        artist: item.releaseGroup.primaryArtistCredit,
        albumMbid: item.releaseGroup.mbid,
        artistMbid: item.releaseGroup.artistMbid,
        rating: item.rating ?? undefined,
        date: new Date(item.createdAt).toLocaleDateString(),
    };
}

function LatestActivity({
    activity,
    canDelete,
    onDelete,
}: {
    activity: ProfileActivityItem[];
    canDelete: boolean;
    onDelete: (id: string) => void;
}) {
    return (
        <section>
            <div className="flex items-baseline justify-between mb-5">
                <h2
                    className="text-h3 font-medium"
                    style={{ letterSpacing: "-0.005em" }}
                >
                    Latest activity
                </h2>
                <span className="text-caption text-steel">Recent</span>
            </div>
            {activity.length > 0 ? (
                <div className="rounded-md bg-surface px-4 md:px-6">
                    {activity.map((item) => (
                        <ActivityItem
                            key={item.id}
                            entry={toActivityEntry(item)}
                            canDelete={canDelete}
                            onDelete={() => onDelete(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-md border-[0.5px] border-(--hairline) bg-surface px-4 py-8 text-caption text-steel text-center">
                    No activity yet.
                </div>
            )}
        </section>
    );
}

function OverviewTab({
    profile,
    summary,
    activity,
    onDeleteActivity,
}: {
    profile: ProfileData;
    summary: ProfileSummary | null;
    activity: ProfileActivityItem[];
    onDeleteActivity: (id: string) => void;
}) {
    return (
        <div className="mt-10 flex flex-col gap-14 md:gap-20">
            <StatsOverview summary={summary} />
            <PinnedAlbums
                pins={profile.pinnedReleaseGroups}
                isOwnProfile={profile.isOwnProfile}
            />
            <LatestActivity
                activity={activity}
                canDelete={profile.isOwnProfile}
                onDelete={onDeleteActivity}
            />
        </div>
    );
}

function PrivateProfile({ profile }: { profile: ProfileData }) {
    return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-24">
            <section className="flex flex-col items-center text-center">
                <Avatar
                    imageUrl={profile.imageUrl}
                    name={profile.handle}
                    seed={profile.handle}
                    size={112}
                />
                <h1
                    className="mt-6 text-[32px] sm:text-h1 font-medium text-paper"
                    style={{
                        letterSpacing: "-0.02em",
                        lineHeight: 1.05,
                    }}
                >
                    {profile.handle}
                </h1>
                <p className="mt-3 text-body text-steel">Private profile</p>
            </section>
        </main>
    );
}

export default function ProfileView({
    profile,
    summary,
    activity,
    library,
    reviews,
}: {
    profile: ProfileData;
    summary: ProfileSummary | null;
    activity: ProfileActivityItem[];
    library: ProfileLibraryItem[];
    reviews: ProfileReviewItem[];
}) {
    const [tab, setTab] = useState<TabId>("overview");
    const [following, setFollowing] = useState(false);
    const [activityItems, setActivityItems] = useState(activity);

    function removeActivity(id: string) {
        const previous = activityItems;
        setActivityItems((items) => items.filter((item) => item.id !== id));
        void deleteActivity(id).catch(() => setActivityItems(previous));
    }

    if (profile.privateProfile) {
        return <PrivateProfile profile={profile} />;
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
            <Banner profile={profile} />
            <IdentityBar
                profile={profile}
                following={following}
                onToggleFollow={() => setFollowing((v) => !v)}
            />
            <TabNav tab={tab} onChange={setTab} />

            {tab === "overview" && (
                <OverviewTab
                    profile={profile}
                    summary={summary}
                    activity={activityItems}
                    onDeleteActivity={removeActivity}
                />
            )}
            {tab === "albums" && <AlbumListTab items={library} />}
            {tab === "tracks" && <TrackListTab />}
            {tab === "stats" && <StatsTab />}
            {tab === "reviews" && (
                <ReviewsTab
                    initialItems={reviews}
                    canManage={profile.isOwnProfile}
                />
            )}

            <div className="h-20 md:h-32" />
        </main>
    );
}

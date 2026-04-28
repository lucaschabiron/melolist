import { Elysia, t } from "elysia";
import {
    and,
    artist,
    count,
    db,
    desc,
    eq,
    inArray,
    or,
    release,
    releaseGroup,
    releaseMedium,
    releaseTrack,
    sql,
    userActivity,
    userLibraryItem,
    userProfileTable,
    userReview,
    userTrackRating,
    user as userTable,
} from "@melolist/db";
import {
    avatarKey,
    deleteObject,
    InvalidImageError,
    keyFromPublicUrl,
    processAvatar,
    publicUrl,
    putObject,
} from "@melolist/storage";
import { authPlugin } from "../../lib/auth-plugin";

const MAX_PINNED_ALBUMS = 4;

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIBRARY_STATUSES = [
    "backlog",
    "listening",
    "listened",
    "loved",
    "shelved",
] as const;

type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

function parseLimitOffset(query: { limit?: string; offset?: string }) {
    const limit = Math.min(
        Math.max(Number.parseInt(query.limit ?? "25", 10) || 25, 1),
        100,
    );
    const offset = Math.max(Number.parseInt(query.offset ?? "0", 10) || 0, 0);
    return { limit, offset };
}

function ratingToDb(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 10) {
        return null;
    }
    return Math.round(value * 10);
}

function ratingFromDb(value: number | null) {
    return value === null ? null : value / 10;
}

function serializeReleaseGroup(row: {
    musicbrainzId: string | null;
    title: string;
    primaryArtistCredit: string;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
    artistMbid?: string | null;
}) {
    return {
        mbid: row.musicbrainzId,
        title: row.title,
        primaryArtistCredit: row.primaryArtistCredit,
        artistMbid: row.artistMbid ?? null,
        year: row.firstReleaseDate
            ? Number(row.firstReleaseDate.slice(0, 4))
            : null,
        coverArtUrl: row.coverArtUrl,
    };
}

async function visibleUserByHandle(handle: string, currentUserId: string) {
    const handleLower = handle.toLowerCase();
    const [targetUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.username, handleLower))
        .limit(1);

    if (!targetUser) return null;

    const [profile] = await db
        .select()
        .from(userProfileTable)
        .where(eq(userProfileTable.userId, targetUser.id))
        .limit(1);

    const isOwnProfile = currentUserId === targetUser.id;
    const isPrivate = profile?.isPrivate ?? false;

    return {
        user: targetUser,
        profile,
        isOwnProfile,
        privateProfile: isPrivate && !isOwnProfile,
    };
}

async function releaseGroupByMbid(mbid: string) {
    if (!UUID_RE.test(mbid)) return null;
    const [row] = await db
        .select()
        .from(releaseGroup)
        .where(eq(releaseGroup.musicbrainzId, mbid))
        .limit(1);
    return row ?? null;
}

function serializeTrackRating(row: {
    recordingMbid: string;
    rating: number;
    updatedAt: Date;
}) {
    return {
        recordingMbid: row.recordingMbid,
        rating: ratingFromDb(row.rating)!,
        updatedAt: row.updatedAt.toISOString(),
    };
}

async function visibleActivityRows(
    userId: string,
    limit: number,
    offset: number,
) {
    const rows = await db
        .select({
            id: userActivity.id,
            type: userActivity.type,
            rating: userActivity.rating,
            libraryStatus: userActivity.status,
            reviewId: userActivity.reviewId,
            releaseGroupId: userActivity.releaseGroupId,
            createdAt: userActivity.createdAt,
            artistMbid: artist.musicbrainzId,
            releaseGroup,
        })
        .from(userActivity)
        .innerJoin(
            releaseGroup,
            eq(userActivity.releaseGroupId, releaseGroup.id),
        )
        .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
        .where(eq(userActivity.userId, userId))
        .orderBy(desc(userActivity.createdAt))
        .limit(Math.max(limit + offset, limit) * 3)
        .offset(0);

    const releaseGroupIds = [
        ...new Set(
            rows
                .filter((row) => row.type === "owned" || row.type === "unowned")
                .map((row) => row.releaseGroupId),
        ),
    ];
    const collectionItems =
        releaseGroupIds.length > 0
            ? await db
                  .select({
                      releaseGroupId: userLibraryItem.releaseGroupId,
                      owned: userLibraryItem.owned,
                  })
                  .from(userLibraryItem)
                  .where(
                      and(
                          eq(userLibraryItem.userId, userId),
                          inArray(
                              userLibraryItem.releaseGroupId,
                              releaseGroupIds,
                          ),
                      ),
                  )
            : [];
    const ownedByReleaseGroup = new Map(
        collectionItems.map((item) => [item.releaseGroupId, item.owned]),
    );
    const seenCollectionActivity = new Set<string>();

    return rows
        .filter((row) => {
            if (row.type !== "owned" && row.type !== "unowned") return true;
            if (seenCollectionActivity.has(row.releaseGroupId)) return false;
            seenCollectionActivity.add(row.releaseGroupId);
            return (
                row.type === "owned" &&
                ownedByReleaseGroup.get(row.releaseGroupId) === true
            );
        })
        .slice(offset, offset + limit);
}

async function hydratePins(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await db
        .select({
            id: releaseGroup.id,
            mbid: releaseGroup.musicbrainzId,
            title: releaseGroup.title,
            primaryArtistCredit: releaseGroup.primaryArtistCredit,
            firstReleaseDate: releaseGroup.firstReleaseDate,
            coverArtUrl: releaseGroup.coverArtUrl,
        })
        .from(releaseGroup)
        .where(
            or(
                inArray(releaseGroup.id, ids),
                inArray(releaseGroup.musicbrainzId, ids),
            ),
        );

    const byId = new Map(
        rows.flatMap((r) => [[r.id, r] as const, [r.mbid, r] as const]),
    );
    return ids
        .map((id) => byId.get(id))
        .filter((r): r is NonNullable<typeof r> => r != null && r.mbid != null)
        .map((r) => ({
            mbid: r.mbid!,
            title: r.title,
            primaryArtistCredit: r.primaryArtistCredit,
            firstReleaseDate: r.firstReleaseDate,
            coverArtUrl: r.coverArtUrl,
        }));
}

async function pinnedReleaseGroupsExist(ids: string[]) {
    if (ids.length === 0) return true;
    const rows = await db
        .select({
            id: releaseGroup.id,
            mbid: releaseGroup.musicbrainzId,
        })
        .from(releaseGroup)
        .where(
            or(
                inArray(releaseGroup.id, ids),
                inArray(releaseGroup.musicbrainzId, ids),
            ),
        );

    const found = new Set(rows.flatMap((r) => [r.id, r.mbid]));
    return ids.every((id) => found.has(id));
}

export const userController = new Elysia({
    name: "user",
    prefix: "/users",
})
    .use(authPlugin)

    .get(
        "/me",
        async ({ user }) => {
            const [profile] = await db
                .select()
                .from(userProfileTable)
                .where(eq(userProfileTable.userId, user.id))
                .limit(1);

            return {
                id: user.id,
                handle: user.username ?? null,
                displayName: user.username ?? user.name,
                email: user.email,
                imageUrl: user.image ?? null,
                bio: profile?.bio ?? null,
                location: profile?.location ?? null,
                isPrivate: profile?.isPrivate ?? false,
                pinnedReleaseGroupIds: profile?.pinnedReleaseGroupIds ?? [],
            };
        },
        { auth: true },
    )

    .get(
        "/:handle",
        async ({ params: { handle }, user: currentUser, status }) => {
            const handleLower = handle.toLowerCase();
            const [targetUser] = await db
                .select()
                .from(userTable)
                .where(eq(userTable.username, handleLower))
                .limit(1);

            if (!targetUser) return status(404, { error: "user not found" });

            const [profile] = await db
                .select()
                .from(userProfileTable)
                .where(eq(userProfileTable.userId, targetUser.id))
                .limit(1);

            const isOwnProfile = currentUser.id === targetUser.id;
            const isPrivate = profile?.isPrivate ?? false;
            const hidePrivateFields = isPrivate && !isOwnProfile;
            const pinnedReleaseGroups = hidePrivateFields
                ? []
                : await hydratePins(profile?.pinnedReleaseGroupIds ?? []);

            return {
                handle: targetUser.username ?? handleLower,
                displayName: targetUser.username ?? targetUser.name,
                imageUrl: targetUser.image ?? null,
                bio: hidePrivateFields ? null : (profile?.bio ?? null),
                location: hidePrivateFields
                    ? null
                    : (profile?.location ?? null),
                isPrivate,
                joinedAt: targetUser.createdAt.toISOString(),
                isOwnProfile,
                privateProfile: hidePrivateFields,
                pinnedReleaseGroups,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
        },
    )

    .get(
        "/:handle/library/summary",
        async ({ params: { handle }, user: currentUser, status }) => {
            const target = await visibleUserByHandle(handle, currentUser.id);
            if (!target) return status(404, { error: "user not found" });
            if (target.privateProfile) {
                return {
                    privateProfile: true,
                    message: "Private profile",
                };
            }

            const [items, reviewCountRows] = await Promise.all([
                db
                    .select({
                        rating: userLibraryItem.rating,
                        status: userLibraryItem.status,
                        owned: userLibraryItem.owned,
                        artistId: releaseGroup.artistId,
                    })
                    .from(userLibraryItem)
                    .innerJoin(
                        releaseGroup,
                        eq(userLibraryItem.releaseGroupId, releaseGroup.id),
                    )
                    .where(eq(userLibraryItem.userId, target.user.id)),
                db
                    .select({ value: count() })
                    .from(userReview)
                    .where(eq(userReview.userId, target.user.id)),
            ]);

            const ratedItems = items.filter((item) => item.rating !== null);
            const ratingSum = ratedItems.reduce(
                (sum, item) => sum + (item.rating ?? 0),
                0,
            );
            const statusBreakdown = Object.fromEntries(
                LIBRARY_STATUSES.map((libraryStatus) => [
                    libraryStatus,
                    items.filter((item) => item.status === libraryStatus)
                        .length,
                ]),
            ) as Record<LibraryStatus, number>;

            return {
                privateProfile: false,
                summary: {
                    libraryItems: items.length,
                    albumsRated: ratedItems.length,
                    reviews: reviewCountRows[0]?.value ?? 0,
                    distinctArtists: new Set(items.map((item) => item.artistId))
                        .size,
                    averageRating:
                        ratedItems.length > 0
                            ? ratingSum / ratedItems.length / 10
                            : null,
                    owned: items.filter((item) => item.owned).length,
                    statusBreakdown,
                },
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
        },
    )

    .get(
        "/:handle/ratings",
        async ({ params: { handle }, query, user: currentUser, status }) => {
            const target = await visibleUserByHandle(handle, currentUser.id);
            if (!target) return status(404, { error: "user not found" });
            if (target.privateProfile) {
                return {
                    privateProfile: true,
                    message: "Private profile",
                };
            }

            const { limit, offset } = parseLimitOffset(query);
            const rows = await db
                .select({
                    id: userLibraryItem.id,
                    rating: userLibraryItem.rating,
                    status: userLibraryItem.status,
                    owned: userLibraryItem.owned,
                    listenedAt: userLibraryItem.listenedAt,
                    updatedAt: userLibraryItem.updatedAt,
                    artistMbid: artist.musicbrainzId,
                    releaseGroup,
                })
                .from(userLibraryItem)
                .innerJoin(
                    releaseGroup,
                    eq(userLibraryItem.releaseGroupId, releaseGroup.id),
                )
                .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
                .where(
                    and(
                        eq(userLibraryItem.userId, target.user.id),
                        sql`${userLibraryItem.rating} IS NOT NULL`,
                    ),
                )
                .orderBy(desc(userLibraryItem.updatedAt))
                .limit(limit)
                .offset(offset);

            return {
                privateProfile: false,
                items: rows.map((row) => ({
                    id: row.id,
                    rating: ratingFromDb(row.rating)!,
                    status: row.status,
                    owned: row.owned,
                    listenedAt: row.listenedAt?.toISOString() ?? null,
                    updatedAt: row.updatedAt.toISOString(),
                    releaseGroup: serializeReleaseGroup({
                        ...row.releaseGroup,
                        artistMbid: row.artistMbid,
                    }),
                })),
                limit,
                offset,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
            query: t.Object({
                limit: t.Optional(t.String()),
                offset: t.Optional(t.String()),
            }),
        },
    )

    .get(
        "/:handle/library",
        async ({ params: { handle }, query, user: currentUser, status }) => {
            const target = await visibleUserByHandle(handle, currentUser.id);
            if (!target) return status(404, { error: "user not found" });
            if (target.privateProfile) {
                return {
                    privateProfile: true,
                    message: "Private profile",
                };
            }

            const { limit, offset } = parseLimitOffset(query);
            const rows = await db
                .select({
                    id: userLibraryItem.id,
                    rating: userLibraryItem.rating,
                    status: userLibraryItem.status,
                    owned: userLibraryItem.owned,
                    listenedAt: userLibraryItem.listenedAt,
                    updatedAt: userLibraryItem.updatedAt,
                    artistMbid: artist.musicbrainzId,
                    releaseGroup,
                })
                .from(userLibraryItem)
                .innerJoin(
                    releaseGroup,
                    eq(userLibraryItem.releaseGroupId, releaseGroup.id),
                )
                .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
                .where(eq(userLibraryItem.userId, target.user.id))
                .orderBy(desc(userLibraryItem.updatedAt))
                .limit(limit)
                .offset(offset);

            return {
                privateProfile: false,
                items: rows.map((row) => ({
                    id: row.id,
                    rating: ratingFromDb(row.rating),
                    status: row.status,
                    owned: row.owned,
                    listenedAt: row.listenedAt?.toISOString() ?? null,
                    updatedAt: row.updatedAt.toISOString(),
                    releaseGroup: serializeReleaseGroup({
                        ...row.releaseGroup,
                        artistMbid: row.artistMbid,
                    }),
                })),
                limit,
                offset,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
            query: t.Object({
                limit: t.Optional(t.String()),
                offset: t.Optional(t.String()),
            }),
        },
    )

    .get(
        "/:handle/reviews",
        async ({ params: { handle }, query, user: currentUser, status }) => {
            const target = await visibleUserByHandle(handle, currentUser.id);
            if (!target) return status(404, { error: "user not found" });
            if (target.privateProfile) {
                return {
                    privateProfile: true,
                    message: "Private profile",
                };
            }

            const { limit, offset } = parseLimitOffset(query);
            const rows = await db
                .select({
                    id: userReview.id,
                    rating: userReview.rating,
                    body: userReview.body,
                    tags: userReview.tags,
                    isMain: userReview.isMain,
                    createdAt: userReview.createdAt,
                    updatedAt: userReview.updatedAt,
                    artistMbid: artist.musicbrainzId,
                    releaseGroup,
                })
                .from(userReview)
                .innerJoin(
                    releaseGroup,
                    eq(userReview.releaseGroupId, releaseGroup.id),
                )
                .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
                .where(eq(userReview.userId, target.user.id))
                .orderBy(desc(userReview.createdAt))
                .limit(limit)
                .offset(offset);

            return {
                privateProfile: false,
                items: rows.map((row) => ({
                    id: row.id,
                    rating: ratingFromDb(row.rating)!,
                    body: row.body,
                    tags: row.tags,
                    isMain: row.isMain,
                    createdAt: row.createdAt.toISOString(),
                    updatedAt: row.updatedAt.toISOString(),
                    releaseGroup: serializeReleaseGroup({
                        ...row.releaseGroup,
                        artistMbid: row.artistMbid,
                    }),
                })),
                limit,
                offset,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
            query: t.Object({
                limit: t.Optional(t.String()),
                offset: t.Optional(t.String()),
            }),
        },
    )

    .get(
        "/:handle/tracks",
        async ({ params: { handle }, query, user: currentUser, status }) => {
            const target = await visibleUserByHandle(handle, currentUser.id);
            if (!target) return status(404, { error: "user not found" });
            if (target.privateProfile) {
                return {
                    privateProfile: true,
                    message: "Private profile",
                };
            }

            const { limit, offset } = parseLimitOffset(query);
            const ratingRows = await db
                .select({
                    id: userTrackRating.id,
                    recordingMbid: userTrackRating.recordingMbid,
                    rating: userTrackRating.rating,
                    updatedAt: userTrackRating.updatedAt,
                })
                .from(userTrackRating)
                .where(eq(userTrackRating.userId, target.user.id))
                .orderBy(
                    desc(userTrackRating.rating),
                    desc(userTrackRating.updatedAt),
                )
                .limit(limit)
                .offset(offset);

            const recordingMbids = ratingRows.map((row) => row.recordingMbid);
            const appearanceRows =
                recordingMbids.length > 0
                    ? await db
                          .select({
                              recordingMbid: releaseTrack.recordingMbid,
                              trackTitle: releaseTrack.title,
                              trackNumber: releaseTrack.number,
                              trackPosition: releaseTrack.position,
                              lengthMs: releaseTrack.lengthMs,
                              artistMbid: artist.musicbrainzId,
                              releaseGroup,
                          })
                          .from(releaseTrack)
                          .innerJoin(
                              releaseMedium,
                              eq(releaseTrack.mediumId, releaseMedium.id),
                          )
                          .innerJoin(
                              release,
                              eq(releaseMedium.releaseId, release.id),
                          )
                          .innerJoin(
                              releaseGroup,
                              eq(release.releaseGroupId, releaseGroup.id),
                          )
                          .innerJoin(
                              artist,
                              eq(releaseGroup.artistId, artist.id),
                          )
                          .where(
                              inArray(
                                  releaseTrack.recordingMbid,
                                  recordingMbids,
                              ),
                          )
                    : [];

            const appearancesByRecording = new Map(
                appearanceRows.map((row) => [row.recordingMbid, row]),
            );

            return {
                privateProfile: false,
                items: ratingRows.flatMap((row) => {
                    const appearance = appearancesByRecording.get(
                        row.recordingMbid,
                    );
                    if (!appearance) return [];
                    return {
                        id: row.id,
                        recordingMbid: row.recordingMbid,
                        title: appearance.trackTitle,
                        number: appearance.trackNumber,
                        position: appearance.trackPosition,
                        lengthMs: appearance.lengthMs,
                        rating: ratingFromDb(row.rating)!,
                        updatedAt: row.updatedAt.toISOString(),
                        releaseGroup: serializeReleaseGroup({
                            ...appearance.releaseGroup,
                            artistMbid: appearance.artistMbid,
                        }),
                    };
                }),
                limit,
                offset,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
            query: t.Object({
                limit: t.Optional(t.String()),
                offset: t.Optional(t.String()),
            }),
        },
    )

    .get(
        "/:handle/activity",
        async ({ params: { handle }, query, user: currentUser, status }) => {
            const target = await visibleUserByHandle(handle, currentUser.id);
            if (!target) return status(404, { error: "user not found" });
            if (target.privateProfile) {
                return {
                    privateProfile: true,
                    message: "Private profile",
                };
            }

            const { limit, offset } = parseLimitOffset(query);
            const rows = await visibleActivityRows(
                target.user.id,
                limit,
                offset,
            );

            return {
                privateProfile: false,
                items: rows.map((row) => ({
                    id: row.id,
                    type: row.type,
                    rating: ratingFromDb(row.rating),
                    status: row.libraryStatus,
                    reviewId: row.reviewId,
                    createdAt: row.createdAt.toISOString(),
                    releaseGroup: serializeReleaseGroup({
                        ...row.releaseGroup,
                        artistMbid: row.artistMbid,
                    }),
                })),
                limit,
                offset,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
            query: t.Object({
                limit: t.Optional(t.String()),
                offset: t.Optional(t.String()),
            }),
        },
    )

    .post(
        "/me/avatar",
        async ({ body, user, status }) => {
            const file = body.file;
            if (!file) return status(400, { error: "file is required" });

            try {
                const buffer = await file.arrayBuffer();
                const { buffer: resized, contentType } = await processAvatar(
                    buffer,
                    file.type,
                );
                const key = avatarKey(user.id);
                await putObject(key, resized, contentType);
                const newUrl = publicUrl(key);

                const previousKey = keyFromPublicUrl(user.image);

                try {
                    await db
                        .update(userTable)
                        .set({ image: newUrl })
                        .where(eq(userTable.id, user.id));
                } catch (err) {
                    void deleteObject(key).catch(() => {});
                    throw err;
                }

                if (previousKey) {
                    void deleteObject(previousKey).catch(() => {});
                }

                return { imageUrl: newUrl };
            } catch (err) {
                if (err instanceof InvalidImageError) {
                    return status(400, { error: err.message });
                }
                throw err;
            }
        },
        {
            auth: true,
            body: t.Object({
                file: t.File({
                    type: [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/gif",
                        "image/avif",
                    ],
                    maxSize: "5m",
                }),
            }),
        },
    )

    .delete(
        "/me/avatar",
        async ({ user }) => {
            const previousKey = keyFromPublicUrl(user.image);
            await db
                .update(userTable)
                .set({ image: null })
                .where(eq(userTable.id, user.id));
            if (previousKey) {
                void deleteObject(previousKey).catch(() => {});
            }
            return { ok: true };
        },
        { auth: true },
    )

    .get(
        "/me/library/release-groups/:mbid",
        async ({ params: { mbid }, user, status }) => {
            const rg = await releaseGroupByMbid(mbid);
            if (!rg) return status(404, { error: "release group not found" });

            const [libraryItem] = await db
                .select()
                .from(userLibraryItem)
                .where(
                    and(
                        eq(userLibraryItem.userId, user.id),
                        eq(userLibraryItem.releaseGroupId, rg.id),
                    ),
                )
                .limit(1);

            const [mainReview] = await db
                .select()
                .from(userReview)
                .where(
                    and(
                        eq(userReview.userId, user.id),
                        eq(userReview.releaseGroupId, rg.id),
                        eq(userReview.isMain, true),
                    ),
                )
                .orderBy(desc(userReview.createdAt))
                .limit(1);

            return {
                libraryItem: libraryItem
                    ? {
                          id: libraryItem.id,
                          status: libraryItem.status,
                          rating: ratingFromDb(libraryItem.rating),
                          owned: libraryItem.owned,
                          listenedAt:
                              libraryItem.listenedAt?.toISOString() ?? null,
                          updatedAt: libraryItem.updatedAt.toISOString(),
                      }
                    : null,
                mainReview: mainReview
                    ? {
                          id: mainReview.id,
                          rating: ratingFromDb(mainReview.rating)!,
                          body: mainReview.body,
                          tags: mainReview.tags,
                          createdAt: mainReview.createdAt.toISOString(),
                          updatedAt: mainReview.updatedAt.toISOString(),
                      }
                    : null,
            };
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
        },
    )

    .get(
        "/me/track-ratings/release-groups/:mbid",
        async ({ params: { mbid }, user, status }) => {
            const rg = await releaseGroupByMbid(mbid);
            if (!rg) return status(404, { error: "release group not found" });

            const recordingRows = await db
                .select({ recordingMbid: releaseTrack.recordingMbid })
                .from(releaseTrack)
                .innerJoin(
                    releaseMedium,
                    eq(releaseTrack.mediumId, releaseMedium.id),
                )
                .innerJoin(release, eq(releaseMedium.releaseId, release.id))
                .where(
                    and(
                        eq(release.releaseGroupId, rg.id),
                        sql`${releaseTrack.recordingMbid} IS NOT NULL`,
                    ),
                );

            const recordingMbids = [
                ...new Set(
                    recordingRows.flatMap((row) =>
                        row.recordingMbid ? [row.recordingMbid] : [],
                    ),
                ),
            ];

            const rows =
                recordingMbids.length > 0
                    ? await db
                          .select({
                              recordingMbid: userTrackRating.recordingMbid,
                              rating: userTrackRating.rating,
                              updatedAt: userTrackRating.updatedAt,
                          })
                          .from(userTrackRating)
                          .where(
                              and(
                                  eq(userTrackRating.userId, user.id),
                                  inArray(
                                      userTrackRating.recordingMbid,
                                      recordingMbids,
                                  ),
                              ),
                          )
                    : [];

            return { ratings: rows.map(serializeTrackRating) };
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
        },
    )

    .put(
        "/me/track-ratings/:recordingMbid",
        async ({ params: { recordingMbid }, body, user, status }) => {
            if (!UUID_RE.test(recordingMbid)) {
                return status(400, { error: "invalid recording mbid" });
            }

            const [track] = await db
                .select({
                    recordingMbid: releaseTrack.recordingMbid,
                })
                .from(releaseTrack)
                .where(eq(releaseTrack.recordingMbid, recordingMbid))
                .limit(1);
            if (!track) return status(404, { error: "recording not found" });

            const rating = ratingToDb(body.rating);
            if (rating === null) {
                return status(400, {
                    error: "rating must be between 0.0 and 10.0",
                });
            }

            const now = new Date();
            const [trackRating] = await db
                .insert(userTrackRating)
                .values({
                    userId: user.id,
                    recordingMbid,
                    rating,
                    updatedAt: now,
                })
                .onConflictDoUpdate({
                    target: [
                        userTrackRating.userId,
                        userTrackRating.recordingMbid,
                    ],
                    set: { rating, updatedAt: now },
                })
                .returning({
                    recordingMbid: userTrackRating.recordingMbid,
                    rating: userTrackRating.rating,
                    updatedAt: userTrackRating.updatedAt,
                });

            return {
                ok: true,
                trackRating: serializeTrackRating(trackRating!),
            };
        },
        {
            auth: true,
            params: t.Object({ recordingMbid: t.String() }),
            body: t.Object({ rating: t.Number() }),
        },
    )

    .delete(
        "/me/track-ratings/:recordingMbid",
        async ({ params: { recordingMbid }, user, status }) => {
            if (!UUID_RE.test(recordingMbid))
                return status(400, { error: "invalid recording mbid" });

            await db
                .delete(userTrackRating)
                .where(
                    and(
                        eq(userTrackRating.userId, user.id),
                        eq(userTrackRating.recordingMbid, recordingMbid),
                    ),
                );

            return { ok: true };
        },
        {
            auth: true,
            params: t.Object({ recordingMbid: t.String() }),
        },
    )

    .delete(
        "/me/activity/:id",
        async ({ params: { id }, user, status }) => {
            if (!UUID_RE.test(id)) return status(400, { error: "invalid id" });

            const [deleted] = await db
                .delete(userActivity)
                .where(
                    and(
                        eq(userActivity.id, id),
                        eq(userActivity.userId, user.id),
                    ),
                )
                .returning({ id: userActivity.id });

            if (!deleted) return status(404, { error: "activity not found" });
            return { ok: true };
        },
        {
            auth: true,
            params: t.Object({ id: t.String() }),
        },
    )

    .put(
        "/me/library/release-groups/:mbid",
        async ({ params: { mbid }, body, user, status }) => {
            const rg = await releaseGroupByMbid(mbid);
            if (!rg) return status(404, { error: "release group not found" });

            const rating =
                body.rating === undefined || body.rating === null
                    ? body.rating
                    : ratingToDb(body.rating);
            if (rating === null && body.rating !== null) {
                return status(400, {
                    error: "rating must be between 0.0 and 10.0",
                });
            }

            const listenedAt =
                body.listenedAt === undefined || body.listenedAt === null
                    ? body.listenedAt
                    : new Date(body.listenedAt);
            if (
                listenedAt instanceof Date &&
                Number.isNaN(listenedAt.getTime())
            ) {
                return status(400, { error: "invalid listenedAt" });
            }

            const shouldUpsert =
                body.status !== undefined ||
                body.rating !== undefined ||
                body.owned !== undefined ||
                body.listenedAt !== undefined;

            const now = new Date();
            let itemId: string | null = null;

            if (shouldUpsert) {
                const insertValues: typeof userLibraryItem.$inferInsert = {
                    userId: user.id,
                    releaseGroupId: rg.id,
                    status: (body.status ?? "listened") as LibraryStatus,
                    rating: rating === undefined ? null : rating,
                    owned: body.owned ?? false,
                    listenedAt: listenedAt === undefined ? null : listenedAt,
                    updatedAt: now,
                };

                const updateSet: Partial<typeof userLibraryItem.$inferInsert> =
                    { updatedAt: now };
                if (body.status !== undefined) updateSet.status = body.status;
                if (body.rating !== undefined)
                    updateSet.rating = rating === undefined ? null : rating;
                if (body.owned !== undefined) updateSet.owned = body.owned;
                if (body.listenedAt !== undefined)
                    updateSet.listenedAt =
                        listenedAt === undefined ? null : listenedAt;

                const [item] = await db
                    .insert(userLibraryItem)
                    .values(insertValues)
                    .onConflictDoUpdate({
                        target: [
                            userLibraryItem.userId,
                            userLibraryItem.releaseGroupId,
                        ],
                        set: updateSet,
                    })
                    .returning({ id: userLibraryItem.id });
                itemId = item?.id ?? null;
            }

            const activities: (typeof userActivity.$inferInsert)[] = [];
            if (body.rating !== undefined && rating !== null) {
                activities.push({
                    userId: user.id,
                    releaseGroupId: rg.id,
                    type: "rated",
                    rating,
                });
            }
            if (body.status !== undefined) {
                activities.push({
                    userId: user.id,
                    releaseGroupId: rg.id,
                    type:
                        body.status === "loved"
                            ? "loved"
                            : body.status === "listened"
                              ? "listened"
                              : "status_changed",
                    status: body.status,
                });
            }
            if (body.owned !== undefined) {
                activities.push({
                    userId: user.id,
                    releaseGroupId: rg.id,
                    type: body.owned ? "owned" : "unowned",
                });
            }
            if (body.revisited) {
                activities.push({
                    userId: user.id,
                    releaseGroupId: rg.id,
                    type: "revisited",
                    rating: rating === undefined ? null : rating,
                });
            }

            if (activities.length > 0) {
                await db.insert(userActivity).values(activities);
            }

            return {
                ok: true,
                libraryItemId: itemId,
            };
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
            body: t.Object({
                status: t.Optional(
                    t.Union(LIBRARY_STATUSES.map((value) => t.Literal(value))),
                ),
                rating: t.Optional(t.Union([t.Number(), t.Null()])),
                owned: t.Optional(t.Boolean()),
                listenedAt: t.Optional(t.Union([t.String(), t.Null()])),
                revisited: t.Optional(t.Boolean()),
            }),
        },
    )

    .post(
        "/me/reviews/release-groups/:mbid",
        async ({ params: { mbid }, body, user, status }) => {
            const rg = await releaseGroupByMbid(mbid);
            if (!rg) return status(404, { error: "release group not found" });

            const rating = ratingToDb(body.rating);
            if (rating === null) {
                return status(400, {
                    error: "rating must be between 0.0 and 10.0",
                });
            }

            const trimmedBody = body.body.trim();
            const tags = (body.tags ?? [])
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
                .slice(0, 12);
            const listenedAt = body.listenedAt
                ? new Date(body.listenedAt)
                : null;
            if (listenedAt && Number.isNaN(listenedAt.getTime())) {
                return status(400, { error: "invalid listenedAt" });
            }
            const now = new Date();

            const review = await db.transaction(async (tx) => {
                await tx
                    .update(userReview)
                    .set({ isMain: false, updatedAt: now })
                    .where(
                        and(
                            eq(userReview.userId, user.id),
                            eq(userReview.releaseGroupId, rg.id),
                            eq(userReview.isMain, true),
                        ),
                    );

                const [created] = await tx
                    .insert(userReview)
                    .values({
                        userId: user.id,
                        releaseGroupId: rg.id,
                        rating,
                        body: trimmedBody,
                        tags,
                        isMain: true,
                    })
                    .returning();

                await tx
                    .insert(userLibraryItem)
                    .values({
                        userId: user.id,
                        releaseGroupId: rg.id,
                        status: "listened",
                        rating,
                        listenedAt,
                        updatedAt: now,
                    })
                    .onConflictDoUpdate({
                        target: [
                            userLibraryItem.userId,
                            userLibraryItem.releaseGroupId,
                        ],
                        set: {
                            rating,
                            ...(listenedAt ? { listenedAt } : {}),
                            updatedAt: now,
                        },
                    });

                await tx.insert(userActivity).values({
                    userId: user.id,
                    releaseGroupId: rg.id,
                    reviewId: created!.id,
                    type: "reviewed",
                    rating,
                });

                return created!;
            });

            return {
                id: review.id,
                rating: ratingFromDb(review.rating)!,
                body: review.body,
                tags: review.tags,
                isMain: review.isMain,
                createdAt: review.createdAt.toISOString(),
                updatedAt: review.updatedAt.toISOString(),
                releaseGroup: serializeReleaseGroup(rg),
            };
        },
        {
            auth: true,
            params: t.Object({ mbid: t.String() }),
            body: t.Object({
                rating: t.Number(),
                body: t.String(),
                tags: t.Optional(t.Array(t.String())),
                listenedAt: t.Optional(t.String()),
            }),
        },
    )

    .delete(
        "/me/reviews/:id",
        async ({ params: { id }, user, status }) => {
            if (!UUID_RE.test(id)) return status(400, { error: "invalid id" });

            const [existing] = await db
                .select()
                .from(userReview)
                .where(
                    and(eq(userReview.id, id), eq(userReview.userId, user.id)),
                )
                .limit(1);

            if (!existing) return status(404, { error: "review not found" });

            await db.transaction(async (tx) => {
                await tx
                    .delete(userActivity)
                    .where(eq(userActivity.reviewId, id));
                await tx.delete(userReview).where(eq(userReview.id, id));

                if (!existing.isMain) return;

                const [latest] = await tx
                    .select()
                    .from(userReview)
                    .where(
                        and(
                            eq(userReview.userId, user.id),
                            eq(
                                userReview.releaseGroupId,
                                existing.releaseGroupId,
                            ),
                        ),
                    )
                    .orderBy(desc(userReview.createdAt))
                    .limit(1);

                if (!latest) {
                    await tx
                        .update(userLibraryItem)
                        .set({ rating: null, updatedAt: new Date() })
                        .where(
                            and(
                                eq(userLibraryItem.userId, user.id),
                                eq(
                                    userLibraryItem.releaseGroupId,
                                    existing.releaseGroupId,
                                ),
                            ),
                        );
                    return;
                }

                await tx
                    .update(userReview)
                    .set({ isMain: true, updatedAt: new Date() })
                    .where(eq(userReview.id, latest.id));

                await tx
                    .update(userLibraryItem)
                    .set({ rating: latest.rating, updatedAt: new Date() })
                    .where(
                        and(
                            eq(userLibraryItem.userId, user.id),
                            eq(
                                userLibraryItem.releaseGroupId,
                                existing.releaseGroupId,
                            ),
                        ),
                    );
            });

            return { ok: true };
        },
        {
            auth: true,
            params: t.Object({ id: t.String() }),
        },
    )

    .patch(
        "/me/reviews/:id",
        async ({ params: { id }, body, user, status }) => {
            if (!UUID_RE.test(id)) return status(400, { error: "invalid id" });

            const [existing] = await db
                .select({
                    review: userReview,
                    releaseGroup,
                    artistMbid: artist.musicbrainzId,
                })
                .from(userReview)
                .innerJoin(
                    releaseGroup,
                    eq(userReview.releaseGroupId, releaseGroup.id),
                )
                .innerJoin(artist, eq(releaseGroup.artistId, artist.id))
                .where(
                    and(eq(userReview.id, id), eq(userReview.userId, user.id)),
                )
                .limit(1);

            if (!existing) return status(404, { error: "review not found" });

            const rating =
                body.rating === undefined
                    ? existing.review.rating
                    : ratingToDb(body.rating);
            if (rating === null) {
                return status(400, {
                    error: "rating must be between 0.0 and 10.0",
                });
            }

            const tags =
                body.tags === undefined
                    ? existing.review.tags
                    : body.tags
                          .map((tag) => tag.trim())
                          .filter((tag) => tag.length > 0)
                          .slice(0, 12);
            const reviewBody =
                body.body === undefined
                    ? existing.review.body
                    : body.body.trim();
            const now = new Date();

            const [updated] = await db
                .update(userReview)
                .set({
                    rating,
                    body: reviewBody,
                    tags,
                    updatedAt: now,
                })
                .where(eq(userReview.id, id))
                .returning();

            if (updated?.isMain) {
                await db
                    .update(userLibraryItem)
                    .set({ rating, updatedAt: now })
                    .where(
                        and(
                            eq(userLibraryItem.userId, user.id),
                            eq(
                                userLibraryItem.releaseGroupId,
                                updated.releaseGroupId,
                            ),
                        ),
                    );
            }

            return {
                id: updated!.id,
                rating: ratingFromDb(updated!.rating)!,
                body: updated!.body,
                tags: updated!.tags,
                isMain: updated!.isMain,
                createdAt: updated!.createdAt.toISOString(),
                updatedAt: updated!.updatedAt.toISOString(),
                releaseGroup: serializeReleaseGroup({
                    ...existing.releaseGroup,
                    artistMbid: existing.artistMbid,
                }),
            };
        },
        {
            auth: true,
            params: t.Object({ id: t.String() }),
            body: t.Partial(
                t.Object({
                    rating: t.Number(),
                    body: t.String(),
                    tags: t.Array(t.String()),
                }),
            ),
        },
    )

    .patch(
        "/me",
        async ({ body, user, status }) => {
            if (body.pinnedReleaseGroupIds) {
                if (body.pinnedReleaseGroupIds.length > MAX_PINNED_ALBUMS) {
                    return status(400, {
                        error: `at most ${MAX_PINNED_ALBUMS} pinned albums`,
                    });
                }
                for (const id of body.pinnedReleaseGroupIds) {
                    if (!UUID_RE.test(id)) {
                        return status(400, {
                            error: "invalid release group id",
                        });
                    }
                }
                if (
                    !(await pinnedReleaseGroupsExist(
                        body.pinnedReleaseGroupIds,
                    ))
                ) {
                    return status(400, {
                        error: "pinned albums must exist in the catalog",
                    });
                }
            }

            const updates: Partial<typeof userProfileTable.$inferInsert> = {};
            if (body.bio !== undefined) updates.bio = body.bio;
            if (body.location !== undefined) updates.location = body.location;
            if (body.isPrivate !== undefined)
                updates.isPrivate = body.isPrivate;
            if (body.pinnedReleaseGroupIds !== undefined)
                updates.pinnedReleaseGroupIds = body.pinnedReleaseGroupIds;

            if (Object.keys(updates).length === 0) return { ok: true };

            await db
                .update(userProfileTable)
                .set(updates)
                .where(eq(userProfileTable.userId, user.id));

            return { ok: true };
        },
        {
            auth: true,
            body: t.Partial(
                t.Object({
                    bio: t.Union([t.String(), t.Null()]),
                    location: t.Union([t.String(), t.Null()]),
                    isPrivate: t.Boolean(),
                    pinnedReleaseGroupIds: t.Array(t.String()),
                }),
            ),
        },
    );

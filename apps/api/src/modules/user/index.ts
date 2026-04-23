import { Elysia, t } from "elysia";
import {
    db,
    eq,
    inArray,
    releaseGroup,
    userProfileTable,
    user as userTable,
} from "@melolist/db";
import { authPlugin } from "../../lib/auth-plugin";

const MAX_PINNED_ALBUMS = 4;

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        .where(inArray(releaseGroup.id, ids));

    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids
        .map((id) => byId.get(id))
        .filter(
            (r): r is NonNullable<typeof r> => r != null && r.mbid != null,
        )
        .map((r) => ({
            mbid: r.mbid!,
            title: r.title,
            primaryArtistCredit: r.primaryArtistCredit,
            firstReleaseDate: r.firstReleaseDate,
            coverArtUrl: r.coverArtUrl,
        }));
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
                displayName: user.name,
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
                displayName: targetUser.name,
                imageUrl: targetUser.image ?? null,
                bio: hidePrivateFields ? null : (profile?.bio ?? null),
                location: hidePrivateFields
                    ? null
                    : (profile?.location ?? null),
                isPrivate,
                joinedAt: targetUser.createdAt.toISOString(),
                isOwnProfile,
                pinnedReleaseGroups,
            };
        },
        {
            auth: true,
            params: t.Object({ handle: t.String() }),
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

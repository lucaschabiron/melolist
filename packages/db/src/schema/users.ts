import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { releaseGroup } from "./release-groups";

export const userProfileTable = pgTable("user_profile", {
    userId: text()
        .primaryKey()
        .references(() => user.id, { onDelete: "cascade" }),
    bio: text(),
    location: text(),
    isPrivate: boolean().notNull().default(false),
    pinnedReleaseGroupIds: uuid().array().notNull().default([]),
});

export const userLibraryStatusEnum = pgEnum("user_library_status", [
    "backlog",
    "listening",
    "listened",
    "loved",
    "shelved",
]);

export const userActivityTypeEnum = pgEnum("user_activity_type", [
    "rated",
    "reviewed",
    "revisited",
    "loved",
    "listened",
    "owned",
    "unowned",
    "status_changed",
]);

export const userLibraryItem = pgTable(
    "user_library_item",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        releaseGroupId: uuid("release_group_id")
            .notNull()
            .references(() => releaseGroup.id, { onDelete: "cascade" }),
        status: userLibraryStatusEnum("status").notNull().default("listened"),
        rating: integer("rating"),
        owned: boolean("owned").notNull().default(false),
        listenedAt: timestamp("listened_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("user_library_item_user_release_group_unique").on(
            table.userId,
            table.releaseGroupId,
        ),
        index("user_library_item_user_id_idx").on(table.userId),
        index("user_library_item_release_group_id_idx").on(
            table.releaseGroupId,
        ),
        index("user_library_item_user_updated_at_idx").on(
            table.userId,
            table.updatedAt,
        ),
    ],
);

export const userReview = pgTable(
    "user_review",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        releaseGroupId: uuid("release_group_id")
            .notNull()
            .references(() => releaseGroup.id, { onDelete: "cascade" }),
        rating: integer("rating").notNull(),
        body: text("body").notNull(),
        tags: text("tags").array().notNull().default([]),
        isMain: boolean("is_main").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("user_review_user_id_idx").on(table.userId),
        index("user_review_release_group_id_idx").on(table.releaseGroupId),
        index("user_review_user_created_at_idx").on(
            table.userId,
            table.createdAt,
        ),
        index("user_review_user_release_group_main_idx").on(
            table.userId,
            table.releaseGroupId,
            table.isMain,
        ),
    ],
);

export const userActivity = pgTable(
    "user_activity",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        releaseGroupId: uuid("release_group_id")
            .notNull()
            .references(() => releaseGroup.id, { onDelete: "cascade" }),
        reviewId: uuid("review_id").references(() => userReview.id, {
            onDelete: "set null",
        }),
        type: userActivityTypeEnum("type").notNull(),
        rating: integer("rating"),
        status: userLibraryStatusEnum("status"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("user_activity_user_id_idx").on(table.userId),
        index("user_activity_release_group_id_idx").on(table.releaseGroupId),
        index("user_activity_user_created_at_idx").on(
            table.userId,
            table.createdAt,
        ),
    ],
);

export const userProfileRelations = relations(userProfileTable, ({ one }) => ({
    user: one(user, {
        fields: [userProfileTable.userId],
        references: [user.id],
    }),
}));

export const userLibraryItemRelations = relations(
    userLibraryItem,
    ({ one }) => ({
        user: one(user, {
            fields: [userLibraryItem.userId],
            references: [user.id],
        }),
        releaseGroup: one(releaseGroup, {
            fields: [userLibraryItem.releaseGroupId],
            references: [releaseGroup.id],
        }),
    }),
);

export const userReviewRelations = relations(userReview, ({ one }) => ({
    user: one(user, {
        fields: [userReview.userId],
        references: [user.id],
    }),
    releaseGroup: one(releaseGroup, {
        fields: [userReview.releaseGroupId],
        references: [releaseGroup.id],
    }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
    user: one(user, {
        fields: [userActivity.userId],
        references: [user.id],
    }),
    releaseGroup: one(releaseGroup, {
        fields: [userActivity.releaseGroupId],
        references: [releaseGroup.id],
    }),
    review: one(userReview, {
        fields: [userActivity.reviewId],
        references: [userReview.id],
    }),
}));

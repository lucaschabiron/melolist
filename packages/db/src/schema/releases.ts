import { relations } from "drizzle-orm";
import {
    date,
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { releaseGroup } from "./release-groups";

export const releaseStatusEnum = pgEnum("release_status", [
    "official",
    "promotion",
    "bootleg",
    "pseudo-release",
]);

export const release = pgTable(
    "release",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        musicbrainzId: uuid("musicbrainz_id").notNull().unique(),
        releaseGroupId: uuid("release_group_id")
            .notNull()
            .references(() => releaseGroup.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        status: releaseStatusEnum("status"),
        releaseDate: date("release_date"),
        country: varchar("country", { length: 2 }),
        lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("release_release_group_id_idx").on(table.releaseGroupId),
        index("release_status_idx").on(table.status),
    ],
);

export const releaseRelations = relations(release, ({ one }) => ({
    releaseGroup: one(releaseGroup, {
        fields: [release.releaseGroupId],
        references: [releaseGroup.id],
    }),
}));

import { relations } from "drizzle-orm";
import {
    date,
    integer,
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

export const releaseMedium = pgTable(
    "release_medium",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        releaseId: uuid("release_id")
            .notNull()
            .references(() => release.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        format: text("format"),
        title: text("title"),
        trackCount: integer("track_count"),
    },
    (table) => [
        index("release_medium_release_id_idx").on(table.releaseId),
        index("release_medium_release_position_idx").on(
            table.releaseId,
            table.position,
        ),
    ],
);

export const releaseTrack = pgTable(
    "release_track",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mediumId: uuid("medium_id")
            .notNull()
            .references(() => releaseMedium.id, { onDelete: "cascade" }),
        musicbrainzId: uuid("musicbrainz_id"),
        recordingMbid: uuid("recording_mbid"),
        position: integer("position").notNull(),
        number: text("number"),
        title: text("title").notNull(),
        lengthMs: integer("length_ms"),
    },
    (table) => [
        index("release_track_medium_id_idx").on(table.mediumId),
        index("release_track_medium_position_idx").on(
            table.mediumId,
            table.position,
        ),
    ],
);

export const releaseRelations = relations(release, ({ many, one }) => ({
    releaseGroup: one(releaseGroup, {
        fields: [release.releaseGroupId],
        references: [releaseGroup.id],
    }),
    media: many(releaseMedium),
}));

export const releaseMediumRelations = relations(
    releaseMedium,
    ({ many, one }) => ({
        release: one(release, {
            fields: [releaseMedium.releaseId],
            references: [release.id],
        }),
        tracks: many(releaseTrack),
    }),
);

export const releaseTrackRelations = relations(releaseTrack, ({ one }) => ({
    medium: one(releaseMedium, {
        fields: [releaseTrack.mediumId],
        references: [releaseMedium.id],
    }),
}));

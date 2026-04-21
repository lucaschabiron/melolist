import {
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const mbEntityTypeEnum = pgEnum("mb_entity_type", [
    "artist",
    "release_group",
]);

export const mbFetchStatusEnum = pgEnum("mb_fetch_status", [
    "success",
    "failure",
]);

export const musicbrainzFetchLog = pgTable(
    "musicbrainz_fetch_log",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        entityType: mbEntityTypeEnum("entity_type").notNull(),
        musicbrainzId: uuid("musicbrainz_id").notNull(),
        status: mbFetchStatusEnum("status").notNull(),
        error: text("error"),
        fetchedAt: timestamp("fetched_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("mb_fetch_log_entity_idx").on(
            table.entityType,
            table.musicbrainzId,
        ),
        index("mb_fetch_log_fetched_at_idx").on(table.fetchedAt),
    ],
);

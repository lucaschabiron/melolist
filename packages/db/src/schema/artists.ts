import {
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const artist = pgTable("artist", {
    id: uuid("id").primaryKey().defaultRandom(),
    musicbrainzId: uuid("musicbrainz_id").unique(),
    name: text("name").notNull(),
    sortName: text("sort_name"),
    disambiguation: text("disambiguation"),
    country: varchar("country", { length: 2 }),
    bio: text("bio"),
    foundedYear: integer("founded_year"),
    dissolvedYear: integer("dissolved_year"),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

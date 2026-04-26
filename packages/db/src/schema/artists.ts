import {
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const seedStatusEnum = pgEnum("seed_status", [
    "pending",
    "seeding",
    "ready",
    "failed",
]);

export const artist = pgTable("artist", {
    id: uuid("id").primaryKey().defaultRandom(),
    musicbrainzId: uuid("musicbrainz_id").unique(),
    name: text("name").notNull(),
    sortName: text("sort_name"),
    disambiguation: text("disambiguation"),
    country: varchar("country", { length: 2 }),
    bio: text("bio"),
    imageUrl: text("image_url"),
    foundedYear: integer("founded_year"),
    dissolvedYear: integer("dissolved_year"),
    profileSeedStatus: seedStatusEnum("profile_seed_status")
        .notNull()
        .default("pending"),
    discographySeedStatus: seedStatusEnum("discography_seed_status")
        .notNull()
        .default("pending"),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    discographyFetchedAt: timestamp("discography_fetched_at", {
        withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

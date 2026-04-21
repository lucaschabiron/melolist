import { relations } from "drizzle-orm";
import {
    date,
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { artist } from "./artists";

export const releaseTypeEnum = pgEnum("release_type", [
    "album",
    "ep",
    "single",
    "live",
    "compilation",
    "mixtape",
    "soundtrack",
    "other",
]);

export const releaseGroup = pgTable(
    "release_group",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        musicbrainzId: uuid("musicbrainz_id").unique(),
        artistId: uuid("artist_id")
            .notNull()
            .references(() => artist.id, { onDelete: "cascade" }),
        primaryArtistCredit: text("primary_artist_credit").notNull(),
        title: text("title").notNull(),
        releaseType: releaseTypeEnum("release_type").notNull().default("other"),
        secondaryTypes: text("secondary_types").array(),
        firstReleaseDate: date("first_release_date"),
        coverArtUrl: text("cover_art_url"),
        lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("release_group_artist_id_idx").on(table.artistId)],
);

export const artistRelations = relations(artist, ({ many }) => ({
    releaseGroups: many(releaseGroup),
}));

export const releaseGroupRelations = relations(releaseGroup, ({ one }) => ({
    artist: one(artist, {
        fields: [releaseGroup.artistId],
        references: [artist.id],
    }),
}));

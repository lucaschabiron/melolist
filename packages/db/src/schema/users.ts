import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

// userId (PK, FK → user.id), handle (unique), bio, pronouns, location, isPrivate, hideCollectionPrices, createdAt, updatedAt
export const userProfileTable = pgTable("user_profile", {
    userId: integer().primaryKey(),
    handle: varchar({ length: 25 }).notNull().unique(),
    bio: text(),
});

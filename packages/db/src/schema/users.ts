import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

// userId (PK, FK → user.id), handle (unique), bio, pronouns, location, isPrivate, hideCollectionPrices, createdAt, updatedAt
export const userProfileTable = pgTable("user_profile", {
    userId: text()
        .primaryKey()
        .references(() => user.id, { onDelete: "cascade" }),
    handle: varchar({ length: 25 }).notNull().unique(),
    bio: text(),
});

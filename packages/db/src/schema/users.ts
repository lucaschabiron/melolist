import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userProfileTable = pgTable("user_profile", {
    userId: text()
        .primaryKey()
        .references(() => user.id, { onDelete: "cascade" }),
    bio: text(),
    pronouns: text(),
    location: text(),
    isPrivate: boolean().notNull().default(false),
    pinnedReleaseGroupIds: uuid().array().notNull().default([]),
});

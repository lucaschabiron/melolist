ALTER TABLE "user_profile" DROP CONSTRAINT IF EXISTS "user_profile_handle_unique";--> statement-breakpoint
ALTER TABLE "user_profile" DROP COLUMN IF EXISTS "handle";--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "pronouns" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "isPrivate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "pinnedReleaseGroupIds" uuid[] DEFAULT '{}' NOT NULL;--> statement-breakpoint

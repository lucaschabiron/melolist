CREATE TYPE "public"."seed_status" AS ENUM('pending', 'seeding', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mb_fetch_operation" AS ENUM('fetch_artist', 'fetch_release_group', 'fetch_releases');--> statement-breakpoint
ALTER TABLE "release" ALTER COLUMN "musicbrainz_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "artist" ADD COLUMN "profile_seed_status" "seed_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "artist" ADD COLUMN "discography_seed_status" "seed_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "artist" ADD COLUMN "discography_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "release_group" ADD COLUMN "releases_status" "seed_status";--> statement-breakpoint
ALTER TABLE "musicbrainz_fetch_log" ADD COLUMN "operation" "mb_fetch_operation";--> statement-breakpoint
UPDATE "artist"
SET
	"profile_seed_status" = CASE
		WHEN "last_fetched_at" IS NOT NULL THEN 'ready'::"seed_status"
		ELSE 'pending'::"seed_status"
	END,
	"discography_seed_status" = CASE
		WHEN "last_fetched_at" IS NOT NULL THEN 'ready'::"seed_status"
		ELSE 'pending'::"seed_status"
	END,
	"discography_fetched_at" = CASE
		WHEN "last_fetched_at" IS NOT NULL THEN "last_fetched_at"
		ELSE NULL
	END;--> statement-breakpoint
UPDATE "release_group"
SET "releases_status" = CASE
	WHEN "releases_fetched_at" IS NOT NULL THEN 'ready'::"seed_status"
	WHEN "release_type" = 'album' AND ("secondary_types" IS NULL OR cardinality("secondary_types") = 0) THEN 'pending'::"seed_status"
	ELSE NULL
END;--> statement-breakpoint
UPDATE "musicbrainz_fetch_log"
SET "operation" = CASE
	WHEN "entity_type" = 'artist' THEN 'fetch_artist'::"mb_fetch_operation"
	WHEN "entity_type" = 'release_group' THEN 'fetch_release_group'::"mb_fetch_operation"
	WHEN "entity_type" = 'release' THEN 'fetch_releases'::"mb_fetch_operation"
END;--> statement-breakpoint
ALTER TABLE "musicbrainz_fetch_log" ALTER COLUMN "operation" SET NOT NULL;--> statement-breakpoint

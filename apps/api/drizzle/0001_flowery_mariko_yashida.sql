CREATE TYPE "public"."release_type" AS ENUM('album', 'ep', 'single', 'live', 'compilation', 'mixtape', 'soundtrack', 'other');--> statement-breakpoint
CREATE TYPE "public"."mb_entity_type" AS ENUM('artist', 'release_group');--> statement-breakpoint
CREATE TYPE "public"."mb_fetch_status" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TABLE "artist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"musicbrainz_id" uuid,
	"name" text NOT NULL,
	"sort_name" text,
	"disambiguation" text,
	"country" varchar(2),
	"bio" text,
	"founded_year" integer,
	"dissolved_year" integer,
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artist_musicbrainz_id_unique" UNIQUE("musicbrainz_id")
);
--> statement-breakpoint
CREATE TABLE "release_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"musicbrainz_id" uuid,
	"artist_id" uuid NOT NULL,
	"primary_artist_credit" text NOT NULL,
	"title" text NOT NULL,
	"release_type" "release_type" DEFAULT 'other' NOT NULL,
	"first_release_date" date,
	"cover_art_url" text,
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "release_group_musicbrainz_id_unique" UNIQUE("musicbrainz_id")
);
--> statement-breakpoint
CREATE TABLE "musicbrainz_fetch_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "mb_entity_type" NOT NULL,
	"musicbrainz_id" uuid NOT NULL,
	"status" "mb_fetch_status" NOT NULL,
	"error" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "release_group" ADD CONSTRAINT "release_group_artist_id_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "release_group_artist_id_idx" ON "release_group" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "mb_fetch_log_entity_idx" ON "musicbrainz_fetch_log" USING btree ("entity_type","musicbrainz_id");--> statement-breakpoint
CREATE INDEX "mb_fetch_log_fetched_at_idx" ON "musicbrainz_fetch_log" USING btree ("fetched_at");

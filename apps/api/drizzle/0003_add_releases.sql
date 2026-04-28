CREATE TYPE "public"."release_status" AS ENUM('official', 'promotion', 'bootleg', 'pseudo-release');--> statement-breakpoint
ALTER TYPE "public"."mb_entity_type" ADD VALUE 'release';--> statement-breakpoint
CREATE TABLE "release" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"musicbrainz_id" uuid,
	"release_group_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "release_status",
	"release_date" date,
	"country" varchar(2),
	"last_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "release_musicbrainz_id_unique" UNIQUE("musicbrainz_id")
);
--> statement-breakpoint
ALTER TABLE "release_group" ADD COLUMN "releases_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "release" ADD CONSTRAINT "release_release_group_id_release_group_id_fk" FOREIGN KEY ("release_group_id") REFERENCES "public"."release_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "release_release_group_id_idx" ON "release" USING btree ("release_group_id");--> statement-breakpoint
CREATE INDEX "release_status_idx" ON "release" USING btree ("status");

CREATE TABLE "release_medium" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"format" text,
	"title" text,
	"track_count" integer
);
--> statement-breakpoint
CREATE TABLE "release_track" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medium_id" uuid NOT NULL,
	"musicbrainz_id" uuid,
	"recording_mbid" uuid,
	"position" integer NOT NULL,
	"number" text,
	"title" text NOT NULL,
	"length_ms" integer
);
--> statement-breakpoint
ALTER TABLE "release_medium" ADD CONSTRAINT "release_medium_release_id_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."release"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "release_track" ADD CONSTRAINT "release_track_medium_id_release_medium_id_fk" FOREIGN KEY ("medium_id") REFERENCES "public"."release_medium"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "release_medium_release_id_idx" ON "release_medium" USING btree ("release_id");
--> statement-breakpoint
CREATE INDEX "release_medium_release_position_idx" ON "release_medium" USING btree ("release_id","position");
--> statement-breakpoint
CREATE INDEX "release_track_medium_id_idx" ON "release_track" USING btree ("medium_id");
--> statement-breakpoint
CREATE INDEX "release_track_medium_position_idx" ON "release_track" USING btree ("medium_id","position");

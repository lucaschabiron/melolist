CREATE TABLE "user_track_rating" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"recording_mbid" uuid NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_track_rating" ADD CONSTRAINT "user_track_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_track_rating_user_recording_unique" ON "user_track_rating" USING btree ("user_id","recording_mbid");
--> statement-breakpoint
CREATE INDEX "user_track_rating_user_id_idx" ON "user_track_rating" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_track_rating_recording_mbid_idx" ON "user_track_rating" USING btree ("recording_mbid");
--> statement-breakpoint
CREATE INDEX "user_track_rating_updated_at_idx" ON "user_track_rating" USING btree ("updated_at");

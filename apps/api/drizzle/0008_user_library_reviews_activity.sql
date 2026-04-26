CREATE TYPE "public"."user_library_status" AS ENUM('backlog', 'listening', 'listened', 'loved', 'shelved');
--> statement-breakpoint
CREATE TYPE "public"."user_activity_type" AS ENUM('rated', 'reviewed', 'revisited', 'loved', 'listened', 'owned', 'unowned', 'status_changed');
--> statement-breakpoint
CREATE TABLE "user_library_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"release_group_id" uuid NOT NULL,
	"status" "user_library_status" DEFAULT 'listened' NOT NULL,
	"rating" integer,
	"owned" boolean DEFAULT false NOT NULL,
	"listened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"release_group_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_main" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"release_group_id" uuid NOT NULL,
	"review_id" uuid,
	"type" "user_activity_type" NOT NULL,
	"rating" integer,
	"status" "user_library_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_library_item" ADD CONSTRAINT "user_library_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_library_item" ADD CONSTRAINT "user_library_item_release_group_id_release_group_id_fk" FOREIGN KEY ("release_group_id") REFERENCES "public"."release_group"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_review" ADD CONSTRAINT "user_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_review" ADD CONSTRAINT "user_review_release_group_id_release_group_id_fk" FOREIGN KEY ("release_group_id") REFERENCES "public"."release_group"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_release_group_id_release_group_id_fk" FOREIGN KEY ("release_group_id") REFERENCES "public"."release_group"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_review_id_user_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."user_review"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_library_item_user_release_group_unique" ON "user_library_item" USING btree ("user_id","release_group_id");
--> statement-breakpoint
CREATE INDEX "user_library_item_user_id_idx" ON "user_library_item" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_library_item_release_group_id_idx" ON "user_library_item" USING btree ("release_group_id");
--> statement-breakpoint
CREATE INDEX "user_library_item_user_updated_at_idx" ON "user_library_item" USING btree ("user_id","updated_at");
--> statement-breakpoint
CREATE INDEX "user_review_user_id_idx" ON "user_review" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_review_release_group_id_idx" ON "user_review" USING btree ("release_group_id");
--> statement-breakpoint
CREATE INDEX "user_review_user_created_at_idx" ON "user_review" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "user_review_user_release_group_main_idx" ON "user_review" USING btree ("user_id","release_group_id","is_main");
--> statement-breakpoint
CREATE INDEX "user_activity_user_id_idx" ON "user_activity" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_activity_release_group_id_idx" ON "user_activity" USING btree ("release_group_id");
--> statement-breakpoint
CREATE INDEX "user_activity_user_created_at_idx" ON "user_activity" USING btree ("user_id","created_at");

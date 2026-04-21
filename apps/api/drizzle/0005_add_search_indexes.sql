CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "artist_name_search_trgm_idx" ON "artist" USING gin ((unaccent(lower("name"))) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "artist_sort_name_search_trgm_idx" ON "artist" USING gin ((unaccent(lower(coalesce("sort_name", '')))) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "release_group_title_search_trgm_idx" ON "release_group" USING gin ((unaccent(lower("title"))) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "release_group_primary_artist_credit_search_trgm_idx" ON "release_group" USING gin ((unaccent(lower("primary_artist_credit"))) gin_trgm_ops);--> statement-breakpoint

CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."immutable_unaccent"(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "artist_name_search_trgm_idx" ON "artist" USING gin ((immutable_unaccent(lower("name"))) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "artist_sort_name_search_trgm_idx" ON "artist" USING gin ((immutable_unaccent(lower(coalesce("sort_name", '')))) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "release_group_title_search_trgm_idx" ON "release_group" USING gin ((immutable_unaccent(lower("title"))) gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "release_group_primary_artist_credit_search_trgm_idx" ON "release_group" USING gin ((immutable_unaccent(lower("primary_artist_credit"))) gin_trgm_ops);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."search_cache" (
    "query_key" text NOT NULL,
    "results" jsonb NOT NULL,
    "last_fetched" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ONLY "public"."search_cache"
    ADD CONSTRAINT "search_cache_pkey" PRIMARY KEY ("query_key");

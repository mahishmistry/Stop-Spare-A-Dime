alter table "public"."store_blacklists" drop constraint "store_blacklists_pkey";

drop index if exists "public"."store_blacklists_pkey";


ALTER TABLE ONLY public.store_blacklists
  DROP CONSTRAINT IF EXISTS store_blacklists_pkey;

ALTER TABLE ONLY public.store_blacklists
  ADD CONSTRAINT store_blacklists_pkey PRIMARY KEY (user_id, store_source);
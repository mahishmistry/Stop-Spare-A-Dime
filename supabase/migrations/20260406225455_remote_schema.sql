CREATE UNIQUE INDEX store_blacklists_key ON public.store_blacklists USING btree (user_id, store_source);

alter table "public"."store_blacklists" add constraint "store_blacklists_key" PRIMARY KEY using index "store_blacklists_key";



function create_user_context(user_id: number) {
    return {
        // Stores
        async blacklist_store(store_id: number): Promise<boolean> {return false},
        async unblacklist_store(store_id: number): Promise<boolean> {return false},
        async get_blacklisted_stores(): Promise<Array<number>> {return Array()},

        // Brands
        async blacklist_brand(brand_id: number): Promise<boolean> {return false},
        async unblacklist_brand(brand_id: number): Promise<boolean> {return false},
        async get_blacklisted_brands(): Promise<Array<number>> {return Array()},
        
        // Products
        async favorite_product(product_id: number): Promise<boolean> {return false},
        async unfavorite_product(product_id: number): Promise<boolean> {return false},
        async get_favorite_products(max: number = 10): Promise<Array<number>> {return Array()},

        // Deals
        async save_deal(deal_id: number): Promise<boolean> {return false},
        async unsave_deal(deal_id: number): Promise<boolean> {return false},
        async get_saved_deals(number_to_fetch: number = 10): Promise<Array<number>> {return Array()},

        // Memberships
        async add_store_membership(store_id: number, membership_id: number): Promise<boolean> {return false},
        async remove_store_membership(store_id: number): Promise<boolean> {return false},
        async get_memberships(): Promise<Array<number>> {return Array()},

        // Search History
        async add_search_history(search_query: string, datetime:Date): Promise<boolean> {return false},
        async get_search_history(past_n_searches: number = 10): Promise<Array<string>> {return Array()},
    }
};
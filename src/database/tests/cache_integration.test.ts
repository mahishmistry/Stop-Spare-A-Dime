import { get_cached_search, set_cached_search } from '../queries.ts';
import { truncate_tables, close_pool } from "./test_helpers.ts";
import { initialize_pool, pool } from "../pool.ts";

beforeAll(async () => {
  await initialize_pool(true);
});

beforeEach(async () => {
  await truncate_tables();
});

afterAll(async () => {
  await close_pool();
});

describe('Search Cache Database Queries', () => {
    it('should save and retrieve a cached search result', async () => {
        const queryKey = 'test-product-12345';
        const mockResults = [{ title: 'Store A', price: 5.99 }];

        // 1. Save to cache
        await set_cached_search(queryKey, mockResults);

        // 2. Retrieve from cache
        const cached = await get_cached_search(queryKey);

        expect(cached).not.toBeNull();
        expect(cached.results).toEqual(mockResults);
        expect(cached.last_fetched).toBeDefined();
    });

    it('should return null for a non-existent cache key', async () => {
        const cached = await get_cached_search('does-not-exist');
        expect(cached).toBeNull();
    });

    it('should update an existing cache entry on conflict', async () => {
        const queryKey = 'test-update-key';
        const initialResults = [{ title: 'Store A', price: 5.99 }];
        const updatedResults = [{ title: 'Store B', price: 4.99 }];

        // Initial save
        await set_cached_search(queryKey, initialResults);
        
        // Wait a small amount of time to ensure timestamp changes if we were to test it strictly
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update save
        const updatedEntry = await set_cached_search(queryKey, updatedResults);
        expect(updatedEntry.results).toEqual(updatedResults);

        // Retrieve and verify
        const cached = await get_cached_search(queryKey);
        expect(cached).not.toBeNull();
        expect(cached.results).toEqual(updatedResults);
    });
});

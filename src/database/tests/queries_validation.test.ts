import {
  add_user,
  get_user_by_email,
  add_store,
  add_store_location,
  add_product,
  get_product_by_id,
  add_item,
  add_deal,
  get_deal_by_id,
} from '../queries.js';

describe('database query input validation', () => {
  it('rejects invalid emails when adding a user', async () => {
    await expect(add_user('invalid-email', 'Test')).rejects.toThrow('BAD INPUT: invalid email format');
  });

  it('rejects invalid emails when fetching a user', async () => {
    await expect(get_user_by_email('invalid-email')).rejects.toThrow('BAD INPUT: invalid email format');
  });

  it('rejects blank store sources and invalid urls', async () => {
    await expect(add_store('', 'https://example.com')).rejects.toThrow('BAD INPUT: source must be a non-empty string');
    await expect(add_store('store', 'not-a-url')).rejects.toThrow('BAD INPUT: url must be a valid URL');
  });

  it('rejects blank address fields', async () => {
    await expect(
      add_store_location('store', {
        street: '',
        city: 'Amherst',
        state: 'MA',
        zip_code: '01002',
      })
    ).rejects.toThrow('BAD INPUT: address.street must be a non-empty string');
  });

  it('rejects empty product names and invalid ids', async () => {
    await expect(add_product('')).rejects.toThrow('BAD INPUT: name must be a non-empty string');
    await expect(get_product_by_id(0)).rejects.toThrow('BAD INPUT: product_id must be a positive integer');
  });

  it('rejects invalid item inputs', async () => {
    await expect(add_item(1, 'store', 2, -1)).rejects.toThrow('BAD INPUT: avg_rating must be a non-negative number');
  });

  it('rejects invalid deal inputs', async () => {
    await expect(add_deal(1, 5.99, true, new Date('invalid'))).rejects.toThrow('BAD INPUT: last_fetched must be a valid date');
    await expect(get_deal_by_id(0)).rejects.toThrow('BAD INPUT: deal_id must be a positive integer');
  });
});

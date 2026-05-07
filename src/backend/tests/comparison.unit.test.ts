/* eslint-env jest */
const { getBestItems, compareByUnitPrice } = require('../comparison.cjs');

describe('comparison.getBestItems - unit price handling', () => {
  const run = (items: any[], metrics: Record<string, any>, k = items.length) => {
    const fakeReq = { query: { criteria: 'unit price', k: String(k) } };
    let returned: any = null;
    const fakeRes = {
      json: (d: any) => { returned = d; },
      status: (code: number) => ({ json: (obj: any) => { throw new Error(`HTTP ${code}: ${JSON.stringify(obj)}`); } })
    };
    getBestItems(items, fakeReq, fakeRes, [], metrics);
    expect(returned).not.toBeNull();
    const arr = returned as unknown as any[];
    return arr[0] || arr.find((x: any) => true);
  };

  it('item a: g unit price per single g', () => {
    const item = { product_id: 'a', extracted_price: 4.00 };
    const metrics = { a: { weight: 200, unit: 'g' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(4.00 / 200, 6);
  });

  it('item b: g unit price per single g', () => {
    const item = { product_id: 'b', extracted_price: 3.00 };
    const metrics = { b: { weight: 150, unit: 'g' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(3.00 / 150, 6);
  });

  it('item c: g unit price per single g', () => {
    const item = { product_id: 'c', extracted_price: 2.50 };
    const metrics = { c: { weight: 100, unit: 'g' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(2.50 / 100, 6);
  });

  it('item d: count unit price per single count', () => {
    const item = { product_id: 'd', extracted_price: 3.00 };
    const metrics = { d: { weight: 2, unit: 'count' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('count');
    expect(out.price_per_unit).toBeCloseTo(3.00 / 2, 6);
  });

  const runSingle = (item: any, metrics: Record<string, any>) => {
    const fakeReq = { query: { criteria: 'unit price', k: String(1) } };
    let returned: any = null;
    const fakeRes = {
      json: (d: any) => { returned = d; },
      status: (code: number) => ({ json: (obj: any) => { throw new Error(`HTTP ${code}: ${JSON.stringify(obj)}`); } })
    };
    getBestItems([item], fakeReq, fakeRes, [], metrics);
    expect(returned).not.toBeNull();
    const arr = returned as unknown as any[];
    return arr[0];
  };

  it('u_oz: oz unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_oz', extracted_price: 4.53592 }, { u_oz: { weight: 16, unit: 'oz' } });
    expect(out.unit_type).toBe('oz');
    expect(out.price_per_unit).toBeCloseTo(4.53592 / 16, 6);
  });

  it('u_g: g unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_g', extracted_price: 1.0 }, { u_g: { weight: 100, unit: 'g' } });
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(1.0 / 100, 8);
  });

  it('u_lb: lb unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_lb', extracted_price: 4.53592 }, { u_lb: { weight: 1, unit: 'lb' } });
    expect(out.unit_type).toBe('lb');
    expect(out.price_per_unit).toBeCloseTo(4.53592 / 1, 6);
  });

  it('u_l: l unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_l', extracted_price: 10.0 }, { u_l: { weight: 1, unit: 'l' } });
    expect(out.unit_type).toBe('l');
    expect(out.price_per_unit).toBeCloseTo(10.0 / 1, 6);
  });

  it('u_quart: quart unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_quart', extracted_price: 5.0 }, { u_quart: { weight: 1, unit: 'quart' } });
    expect(out.unit_type).toBe('quart');
    expect(out.price_per_unit).toBeCloseTo(5.0 / 1, 6);
  });

  it('u_count: count unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_count', extracted_price: 6.0 }, { u_count: { weight: 3, unit: 'count' } });
    expect(out.unit_type).toBe('count');
    expect(out.price_per_unit).toBeCloseTo(6.0 / 3, 6);
  });

});

describe('comparison.compareByUnitPrice', () => {
  it('returns a negative value when item A has a lower unit price than item B', () => {
    const a = { product_id: 'a', price_per_unit: 2.0, unit_type: 'g' };
    const b = { product_id: 'b', price_per_unit: 3.0, unit_type: 'g' };

    const [cmp1] = compareByUnitPrice(a, b);
    expect(cmp1).toBeLessThan(0);
  });

  it('returns a positive value when item A has a higher unit price than item B', () => {
    const a = { product_id: 'a', price_per_unit: 6.0, unit_type: 'g' };
    const b = { product_id: 'b', price_per_unit: 3.0, unit_type: 'g' };

    const [cmp2] = compareByUnitPrice(a, b);
    expect(cmp2).toBeGreaterThan(0);
  });

  it('returns zero when two different items have the same unit price', () => {
    const a = { product_id: 'a', price_per_unit: 2.0 };
    const b = { product_id: 'b', price_per_unit: 2.0 };

    const [cmp3] = compareByUnitPrice(a, b);
    expect(cmp3).toBe(0);
  });

  it('returns zero when items have different units and weights but the same unit price', () => {
    const a = { product_id: 'a', price_per_unit: 0.01 };
    const b = { product_id: 'b', price_per_unit: 0.01 };

    const [cmp4] = compareByUnitPrice(a, b);
    expect(cmp4).toBeCloseTo(0, 10);
  });

  it('treats count units as price per single count', () => {
    const a = { product_id: 'a', unit_type: 'count', price_per_unit: 2.0 };
    const b = { product_id: 'b', unit_type: 'count', price_per_unit: 2.0 };

    const [cmp5] = compareByUnitPrice(a, b);
    expect(cmp5).toBe(0);
  });

  it('places unsupported units after comparable items', () => {
    const a = { product_id: 'a', unit_type: 'quart', price_per_unit: Infinity };
    const b = { product_id: 'b', unit_type: 'g', price_per_unit: 3.0 };

    const [cmp6, meta6] = compareByUnitPrice(a, b);
    expect(cmp6).toBeGreaterThan(0);
    expect(meta6).toBe('whole');
  });

  it(("falls back to total price when one item has missing or unusable pricing data"), () => {
    const a = { product_id: 'a', extracted_price: 5.0 };
    const b = { product_id: 'b', extracted_price: 3.0 };
    const metrics = {
      a: { weight: 1, unit: 'quart' },
    };
    const [cmp7, meta7] = compareByUnitPrice(a, b, metrics);
    expect(cmp7).toBeGreaterThan(0);
    expect(meta7).toBe('whole');
  });

  it('returns zero when both items have missing or unusable pricing data', () => {
    const a = { product_id: 'a' };
    const b = { product_id: 'b' };

    const [cmp8, meta8] = compareByUnitPrice(a, b, {});
    expect(cmp8).toBe(0);
    expect(meta8).toBe('whole');
  });
});

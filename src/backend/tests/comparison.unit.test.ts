/* eslint-env jest */
const { getBestItems } = require('../comparison.cjs');

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

  test('item a: g unit price per single g', () => {
    const item = { product_id: 'a', extracted_price: 4.00 };
    const metrics = { a: { weight: 200, unit: 'g' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(4.00 / 200, 6);
  });

  test('item b: g unit price per single g', () => {
    const item = { product_id: 'b', extracted_price: 3.00 };
    const metrics = { b: { weight: 150, unit: 'g' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(3.00 / 150, 6);
  });

  test('item c: g unit price per single g', () => {
    const item = { product_id: 'c', extracted_price: 2.50 };
    const metrics = { c: { weight: 100, unit: 'g' } };
    const out = run([item], metrics, 1);
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(2.50 / 100, 6);
  });

  test('item d: count unit price per single count', () => {
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

  test('u_oz: oz unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_oz', extracted_price: 4.53592 }, { u_oz: { weight: 16, unit: 'oz' } });
    expect(out.unit_type).toBe('oz');
    expect(out.price_per_unit).toBeCloseTo(4.53592 / 16, 6);
  });

  test('u_g: g unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_g', extracted_price: 1.0 }, { u_g: { weight: 100, unit: 'g' } });
    expect(out.unit_type).toBe('g');
    expect(out.price_per_unit).toBeCloseTo(1.0 / 100, 8);
  });

  test('u_lb: lb unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_lb', extracted_price: 4.53592 }, { u_lb: { weight: 1, unit: 'lb' } });
    expect(out.unit_type).toBe('lb');
    expect(out.price_per_unit).toBeCloseTo(4.53592 / 1, 6);
  });

  test('u_l: l unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_l', extracted_price: 10.0 }, { u_l: { weight: 1, unit: 'l' } });
    expect(out.unit_type).toBe('l');
    expect(out.price_per_unit).toBeCloseTo(10.0 / 1, 6);
  });

  test('u_quart: quart unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_quart', extracted_price: 5.0 }, { u_quart: { weight: 1, unit: 'quart' } });
    expect(out.unit_type).toBe('quart');
    expect(out.price_per_unit).toBeCloseTo(5.0 / 1, 6);
  });

  test('u_count: count unit per-unit price', () => {
    const out = runSingle({ product_id: 'u_count', extracted_price: 6.0 }, { u_count: { weight: 3, unit: 'count' } });
    expect(out.unit_type).toBe('count');
    expect(out.price_per_unit).toBeCloseTo(6.0 / 3, 6);
  });

});

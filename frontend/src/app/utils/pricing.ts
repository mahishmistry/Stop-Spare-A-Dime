// Returns the price difference between an "other" retailer/s price and the best retailer's price.
export function priceDiff(retailerPrice: number, bestPrice: number): number {
  return parseFloat((retailerPrice - bestPrice).toFixed(2));
} // can be used to  check logic, b/c if returns negative, then retailer price is not the best

// Formatting price differences like "+$0.75 more", "-$0.75 less", "Same price"
export function formatPriceDiff(retailerPrice: number, bestPrice: number): string {
  const diff = priceDiff(retailerPrice, bestPrice);
  if (diff > 0) return `+$${diff.toFixed(2)} more`;
  if (diff < 0) return `-$${Math.abs(diff).toFixed(2)} less`;
  return 'Same price';
}

// minimum savings calculated to show how much they will be saving at least, no matter where else they go
export function calcMinSavings(bestPrice: number, retailers: { price: number }[]): number {
  if (retailers.length === 0) return 0;
  const cheapestRetailer = Math.min(...retailers.map(r => r.price));
  return parseFloat((cheapestRetailer - bestPrice).toFixed(2));
}

// which price to use: if sale price, use that one.
export function effectivePrice(price: number, salePrice?: number): number {
  return salePrice ?? price;
}
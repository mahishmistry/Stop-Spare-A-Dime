// WILL NEED A SEVERE UPDATE WITH BACKEND IMPLEMENTATION!
import { ArrowLeft, Heart, Bookmark, MapPin, ExternalLink } from 'lucide-react'; // https://lucide.dev/icons/
import { useState } from 'react';
import { Header } from './Header.tsx';
import { Carousel } from './OtherRetailerCarousel.tsx';
import { effectivePrice, formatPriceDiff } from '../utils/pricing.ts';
import React from 'react';

interface Promotion {
  salePrice: number;
  validFrom: string;
  validTo: string;
  pricePerUnitItem: string; // e.g. "$2.49/lb"
}

interface BestChoice {
  store: string;
  price: number;                    // regular price
  pricePerUnitItem: string;         // "$2.99/lb"
  unit: string;                     // "1 LB"
  isOnSale: boolean;
  promotions?: Promotion[];         // sale info if on sale
  snapEligible: boolean;
  distance: string;                 //  "3.5 Miles away"
  address: string;
  mapUrl?: string;                  // if omitted, falls back to Google Maps search
  loyaltyProgramIndicator?: string; // "Price with membership", can change to boolean later.
  isOutOfStock?: boolean;
}

interface Retailer {
  store: string;
  price: number;
  pricePerUnitItem: string;
  unit: string;
  snapEligible: boolean;
  image: string;
  distance?: string;
  address?: string;
  mapUrl?: string;
  isOnSale?: boolean;
  regularPrice?: number;            // original price before sale
  regularPricePerUnitItem?: string; // original unit price before sale
}

interface ItemDetails {
  name: string;
  image: string;
  bestChoice: BestChoice;
  otherRetailers: Retailer[];
}

interface ItemDetailPageProps {
  item: ItemDetails;
  onBack: () => void;
  location: string;
  onLocationChange: (location: string) => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick?: () => void;
  onSettingsClick: () => void;
  onHistoryClick?: () => void;
}

// Returns the active promotion if one is currently valid, falls back to first
function getActivePromotion(promotions?: Promotion[]): Promotion | null {
  if (!promotions || promotions.length === 0) return null;
  const now = new Date();
  return promotions.find(p =>
    new Date(p.validFrom) <= now && new Date(p.validTo) >= now
  ) ?? promotions[0];
}

interface RetailerCardProps {
  retailer: Retailer;
  bestPrice: number;
}

// best deal
function RetailerCard({ retailer, bestPrice }: RetailerCardProps) {
  const diff = formatPriceDiff(retailer.price, bestPrice);
  const isMore = retailer.price > bestPrice;

  const mapUrl = retailer.mapUrl
    ?? (retailer.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(retailer.address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(retailer.store)}`);

  return (
    <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-white hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="w-full bg-gray-50 rounded-lg overflow-hidden mb-3" style={{ height: '100px' }}>
        <img src={retailer.image} alt={retailer.store} className="w-full h-full object-cover" />
      </div>

      <h3 className="font-semibold text-gray-800 text-xs md:text-sm mb-1">{retailer.store}</h3>

      {/* Price — show sale price with strikethrough original if on sale */}
      <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
        <p className="text-[#6FBD7A] font-semibold text-sm">${retailer.price.toFixed(2)}</p>
        {retailer.isOnSale && retailer.regularPrice && (
          <span className="text-xs text-gray-400 line-through">${retailer.regularPrice.toFixed(2)}</span>
        )}
        {retailer.isOnSale && (
          <span className="text-xs text-red-400 font-medium">Sale</span>
        )}
      </div>

      {/* Unit price inline with unit — no separate line */}
      <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
        <p className="text-xs text-gray-500">{retailer.pricePerUnitItem} {retailer.unit}</p>
        {retailer.isOnSale && retailer.regularPricePerUnitItem && (
          <span className="text-xs text-gray-400 line-through">{retailer.regularPricePerUnitItem}</span>
        )}
      </div>

      {/* Distance + address with map link — icon aligned with first line */}
      <div className="flex items-center gap-1 mb-1">
        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <div className="flex flex-col">
          {retailer.distance && (
            <p className="text-xs text-gray-400">{retailer.distance}</p>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-xs text-[#6FBD7A] hover:underline"
          >
            {retailer.address ?? retailer.store}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {retailer.snapEligible && (
        <p className="text-xs text-[#6FBD7A] mb-1">Snap Eligible</p>
      )}

      {/* Price diff vs best */}
      {retailer.price !== bestPrice && (
        <p className={`text-xs mt-auto pt-2 font-medium ${isMore ? 'text-red-400' : 'text-[#6FBD7A]'}`}>
          {diff}
        </p>
      )}
    </div>
  );
}

// actual page begins here:
export function ItemDetailPage({
  item,
  onBack,
  location,
  onLocationChange,
  onLogout,
  onSearch,
  isAuthenticated,
  onLoginClick,
  onHomeClick,
  onSettingsClick,
  onHistoryClick,
}: ItemDetailPageProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Promotion / pricing
  const activePromo = getActivePromotion(item.bestChoice.promotions);
  const bestPrice = effectivePrice(item.bestChoice.price, activePromo?.salePrice);
  const activePricePerUnit = activePromo?.pricePerUnitItem ?? item.bestChoice.pricePerUnitItem;

  const sortedRetailers = [...item.otherRetailers].sort((a, b) => a.price - b.price);

  // Save at least X = difference between cheapest other retailer and best price
  const cheapestOther = sortedRetailers[0]?.price ?? bestPrice;
  const savings = Math.max(0, cheapestOther - bestPrice);

  // Map link for best choice
  const mapUrl = item.bestChoice.mapUrl
    ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.bestChoice.address)}`;

  // Build retailer cards for Carousel
  const retailerCards = sortedRetailers.map((retailer, i) => (
    <RetailerCard key={i} retailer={retailer} bestPrice={bestPrice} />
  ));

  // tsx here that does the html with react
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Header
        location={location}
        onLocationChange={onLocationChange}
        onLogout={onLogout}
        onSearch={onSearch}
        isAuthenticated={isAuthenticated}
        onLoginClick={onLoginClick}
        onHomeClick={onHomeClick}
        onSettingsClick={onSettingsClick}
        onHistoryClick={onHistoryClick}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#6FBD7A] mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-8">

          {/* Product name + sale badge — same font size, inline */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h1 className="text-2xl md:text-4xl font-semibold text-gray-800">{item.name}</h1>
            {item.bestChoice.isOnSale && (
              <span className="text-lg md:text-2xl font-semibold bg-red-600 text-white px-3 py-0.5 rounded-lg">
                Sale
              </span>
            )}
          </div>

          {/* Best Choice */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Best Choice</h2>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">

              {/* Product image — bigger */}
              <div className="w-full sm:w-64 md:w-80 h-64 md:h-80 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>

              {/* Info panel */}
              <div className="flex-1 flex flex-col gap-4">

                {/* Store + price */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-700">{item.bestChoice.store}</h3>
                    <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                      {/* Sale price, strikethrough regular price */}
                      <span className="text-2xl font-semibold text-[#6FBD7A]">
                        ${bestPrice.toFixed(2)}
                      </span>
                      {activePromo && (
                        <span className="text-2xl text-gray-400 line-through">
                          ${item.bestChoice.price.toFixed(2)}
                        </span>
                      )}
                      {/* Active sale unit price, strikethrough regular if on sale */}
                      <span className="text-sm text-gray-500 font-semibold">{activePricePerUnit}</span>
                      {activePromo && (
                        <span className="text-sm text-gray-400 line-through">
                          {item.bestChoice.pricePerUnitItem}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SNAP badge */}
                  {item.bestChoice.snapEligible && (
                    <span className="px-3 py-1 bg-green-50 text-[#6FBD7A] border border-[#6FBD7A] rounded-full text-xs font-medium whitespace-nowrap">
                      SNAP Eligible
                    </span>
                  )}
                </div>

                {/* Active promotion details — original price context */}
                {activePromo && (
                  <p className="text-sm text-red-500 font-medium">
                    Sale ends: {new Date(activePromo.validTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}

                {/* Loyalty program note */}
                {item.bestChoice.loyaltyProgramIndicator && (
                  <p className="text-xs text-gray-500 italic">{item.bestChoice.loyaltyProgramIndicator}</p>
                )}

                {/* Out of stock */}
                {item.bestChoice.isOutOfStock && (
                  <p className="text-sm text-red-500 font-medium">Currently out of stock at this store</p>
                )}

                {/* Savings box — vs cheapest other retailer */}
                {savings > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                    <p className="text-sm font-medium text-[#6FBD7A]">
                      Save at least <span className="text-base font-semibold">${savings.toFixed(2)}</span> vs other nearby stores
                    </p>
                  </div>
                )}

                {/* Location + map link */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">{item.bestChoice.address}</p>
                    <p className="text-sm text-gray-500">{item.bestChoice.distance}</p>
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#6FBD7A] hover:underline mt-1"
                    >
                      Open in Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    {isFavorite ? 'Favorited Product' : 'Favorite Product'}
                  </button>
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-[#6FBD7A] text-[#6FBD7A]' : 'text-gray-400'}`} />
                    {isBookmarked ? 'Bookmarked Deal' : 'Bookmark Deal'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Other Retailers — using shared Carousel */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Compared to Other Retailers</h2>
            {retailerCards.length > 0 ? (
              <Carousel items={retailerCards} responsive gapPx={12} />
            ) : (
              <p className="text-sm text-gray-500">No other retailers available for comparison.</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
import { ArrowLeft, Heart, Bookmark, MapPin, Search, User } from 'lucide-react';
import { useState } from 'react';

interface ItemDetails {
  name: string;
  image: string;
  bestChoice: {
    store: string;
    price: number;
    salePrice?: number;
    unitPrice: string;
    snapEligible: boolean;
    distance: string;
    address: string;
    savings?: string;
  };
  otherRetailers: Array<{
    store: string;
    price: number;
    unitPrice: string;
    snapEligible: boolean;
    image: string;
  }>;
}

interface ItemDetailPageProps {
  item: ItemDetails;
  onBack: () => void;
  location: string;
  onLocationClick: () => void;
}

export function ItemDetailPage({ item, onBack, location, onLocationClick }: ItemDetailPageProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header */}
      <header className="bg-[#F5F5F5] border-b border-[#e0e0e0] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
            <span className="font-semibold text-gray-800">Stop-Spare-A-Dime</span>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-3xl">
            <button
              onClick={onLocationClick}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-[#6FBD7A] transition-colors bg-white whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{location}</span>
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Compare..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent bg-white"
              />
            </div>
          </div>

          <button className="w-12 h-12 rounded-full bg-[#B3B3B3] hover:bg-[#6FBD7A] transition-colors flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#6FBD7A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-gray-800 mb-6">{item.name}</h1>

          {/* Best Choice Section */}
          <div className="mb-8">
            <h2 className="text-gray-800 mb-4 font-semibold">Best Choice:</h2>
            <div className="flex gap-6">
              <div className="w-48 h-48 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1">
                <h3 className="text-gray-800 font-semibold mb-2">{item.bestChoice.store}</h3>
                <div className="space-y-1 text-gray-700">
                  {item.bestChoice.salePrice ? (
                    <p>
                      ${item.bestChoice.salePrice.toFixed(2)} per bottle (2/${(item.bestChoice.salePrice * 2).toFixed(2)} SALE){' '}
                      <span className="line-through text-gray-500">${item.bestChoice.price.toFixed(2)}</span>
                    </p>
                  ) : (
                    <p>${item.bestChoice.price.toFixed(2)}</p>
                  )}
                  <p className="text-sm">{item.bestChoice.unitPrice}</p>
                  {item.bestChoice.snapEligible && (
                    <p className="text-sm text-[#6FBD7A] font-medium">Snap Eligible</p>
                  )}
                  <p className="text-sm">
                    {item.bestChoice.distance} ({item.bestChoice.address})
                  </p>
                </div>

                {item.bestChoice.savings && (
                  <p className="mt-4 font-semibold text-gray-800">{item.bestChoice.savings}</p>
                )}

                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Bookmark
                      className={`w-6 h-6 ${
                        isBookmarked ? 'fill-[#6FBD7A] text-[#6FBD7A]' : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compared to Other Retailers */}
          <div>
            <h2 className="text-gray-800 mb-4 font-semibold">Compared to Other Retailers:</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {item.otherRetailers.map((retailer, index) => (
                <div
                  key={index}
                  className="min-w-[200px] border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-3">
                    <img
                      src={retailer.image}
                      alt={retailer.store}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{retailer.store}</h3>
                  <p className="text-[#6FBD7A] font-semibold mb-1">${retailer.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-600 mb-1">{retailer.unitPrice}</p>
                  {retailer.snapEligible && (
                    <p className="text-xs text-[#6FBD7A]">Snap Eligible</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

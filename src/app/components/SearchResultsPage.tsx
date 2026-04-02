import { ArrowLeft, User } from 'lucide-react';
import { useState } from 'react';

interface SearchResult {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  saleLabel?: string;
  saleEndDate?: string;
  dealText?: string;
  unitPrice?: string;
  savingsText?: string;
}

interface SearchResultsPageProps {
  searchQuery: string;
  results: SearchResult[];
  location: string;
  onProductClick: (result: SearchResult) => void;
  onBack: () => void;
  onShowProfileMenu: () => void;
}

export function SearchResultsPage({
  searchQuery,
  results,
  location,
  onProductClick,
  onBack,
  onShowProfileMenu,
}: SearchResultsPageProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-white border-b border-gray-300 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#B3B3B3] flex items-center justify-center">
              <span className="text-sm text-white">Logo</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <span className="text-sm text-gray-700">{location}</span>
            <button className="text-gray-500">▼</button>
          </div>

          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800"
            />
          </div>

          <button
            onClick={onShowProfileMenu}
            className="w-14 h-14 rounded-full bg-[#B3B3B3] hover:bg-[#6FBD7A] transition-colors flex items-center justify-center"
          >
            <User className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto mt-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">(Filters)</span>
            <button
              onClick={() => toggleFilter('sale')}
              className={`px-3 py-1 rounded-full border transition-colors ${
                activeFilters.includes('sale')
                  ? 'bg-[#6FBD7A] text-white border-[#6FBD7A]'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              Sale Promotions?
            </button>
            <button
              onClick={() => toggleFilter('memberships')}
              className={`px-3 py-1 rounded-full border transition-colors ${
                activeFilters.includes('memberships')
                  ? 'bg-[#6FBD7A] text-white border-[#6FBD7A]'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              Memberships?
            </button>
            <button
              onClick={() => toggleFilter('snap')}
              className={`px-3 py-1 rounded-full border transition-colors ${
                activeFilters.includes('snap')
                  ? 'bg-[#6FBD7A] text-white border-[#6FBD7A]'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              Snap Eligible?
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#6FBD7A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => onProductClick(result)}
              className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow text-left"
            >
              {result.saleLabel && (
                <div className="flex items-start justify-between mb-2">
                  <span className="bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                    {result.saleLabel}
                  </span>
                  {result.saleEndDate && (
                    <span className="text-xs text-gray-600">Ends {result.saleEndDate}</span>
                  )}
                </div>
              )}

              <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img
                  src={result.image}
                  alt={result.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {result.dealText && (
                <p className="text-sm font-medium text-gray-800 mb-2">{result.dealText}</p>
              )}

              <p className="text-xs text-gray-600 mb-1">{result.store}</p>

              {result.unitPrice && (
                <p className="text-sm font-semibold text-gray-800 mb-1">{result.unitPrice}</p>
              )}

              {result.savingsText && (
                <p className="text-xs text-gray-600">{result.savingsText}</p>
              )}
            </button>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found for "{searchQuery}"</p>
          </div>
        )}
      </main>
    </div>
  );
}

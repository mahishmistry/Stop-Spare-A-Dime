import { ArrowLeft } from "lucide-react"; // https://lucide.dev/icons/
import { useState } from "react";
import { Header } from "./Header.tsx";
import React from "react";

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
  snapEligible?: boolean;
  loyaltyProgramIndicator?: boolean;
}

interface SearchResultsPageProps {
  searchQuery: string;
  results: SearchResult[];
  location: string;
  onProductClick: (result: SearchResult) => void;
  onBack: () => void;
  onSearch: (query: string) => void;
  onLocationChange: (location: string) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick?: () => void;
  onSettingsClick: () => void;
  onHistoryClick?: () => void;
  searchHistory?: string[];
}

export function SearchResultsPage({
  searchQuery,
  results,
  location,
  onProductClick,
  onBack,
  onSearch,
  onLocationChange,
  onLogout,
  isAuthenticated,
  onLoginClick,
  onHomeClick,
  onSettingsClick,
  onHistoryClick,
  searchHistory = [],
}: SearchResultsPageProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  // Apply filters to results
  const filteredResults = results.filter((result) => {
    if (activeFilters.length === 0) return true;

    return activeFilters.every((filter) => {
      if (filter === "sale") {
        return result.saleLabel ? true : false;
      }
      if (filter === "memberships") {
        return result.loyaltyProgramIndicator ? true : false;
      }
      if (filter === "snap") {
        return result.snapEligible !== false; // true by default
      }
      return true;
    });
  });

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

      {/* Filters bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <span className="text-gray-700">(Filters)</span>
          <button
            onClick={() => toggleFilter("sale")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              activeFilters.includes("sale")
                ? "bg-[#6FBD7A] text-white border-[#6FBD7A]"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            Sale Promotions?
          </button>
          <button
            onClick={() => toggleFilter("memberships")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              activeFilters.includes("memberships")
                ? "bg-[#6FBD7A] text-white border-[#6FBD7A]"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            Memberships?
          </button>
          <button
            onClick={() => toggleFilter("snap")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              activeFilters.includes("snap")
                ? "bg-[#6FBD7A] text-white border-[#6FBD7A]"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            Snap Eligible?
          </button>
        </div>
      </div>


      <main className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#6FBD7A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {filteredResults.map((result) => (
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
                    <span className="text-xs text-gray-600">
                      Ends {result.saleEndDate}
                    </span>
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
                <p className="text-sm font-medium text-gray-800 mb-2">
                  {result.dealText}
                </p>
              )}

              <p className="text-xs text-gray-600 mb-1">{result.store}</p>

              {result.unitPrice && (
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {result.unitPrice}
                </p>
              )}

              {result.savingsText && (
                <p className="text-xs text-gray-600">{result.savingsText}</p>
              )}
            </button>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No results found for "{searchQuery}"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

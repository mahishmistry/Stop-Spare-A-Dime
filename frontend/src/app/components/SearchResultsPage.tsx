import { ArrowLeft } from "lucide-react"; // https://lucide.dev/icons/
import { useEffect, useState } from "react";
import { Header } from "./Header.tsx";
import type { CompareSort } from "../services/products.ts";
import {apiFetchBlacklist, isBlockedStore } from "../services/blacklist.ts";

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
  comparisonCriteria: CompareSort;
  onComparisonCriteriaChange: (criteria: CompareSort) => void;
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
  accountName?: string;
  accountEmail?: string;
}

export function SearchResultsPage({
  searchQuery,
  results,
  comparisonCriteria,
  onComparisonCriteriaChange,
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
  accountName,
  accountEmail,
}: SearchResultsPageProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [blockedStores, setBlockedStores] = useState<string[]>([]);

  const comparisonOptions: Array<{ value: CompareSort; label: string }> = [
    { value: "price", label: "Lowest Price" },
    { value: "rating", label: "Best Rating" },
    { value: "bang for buck", label: "Best Value" },
    { value: "unit price", label: "Unit Price" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadBlockedStores() {
      try {
        const stores = await apiFetchBlacklist();
        if (!cancelled) setBlockedStores(stores);
      } catch (err) {
        console.error("Failed to load blocked stores for search results:", err);
        if (!cancelled) setBlockedStores([]);
      }
    }

    loadBlockedStores();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  // Apply blacklist and selected filters to results
  const filteredResults = results.filter((result) => {
    if (isBlockedStore(result.store ?? "", blockedStores)) return false;

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
        searchHistory={searchHistory}
        accountName={accountName}
        accountEmail={accountEmail}
      />

      {/* Filters bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-700">Compare by</span>
            <div className="flex flex-wrap rounded-lg border border-gray-300 overflow-hidden">
              {comparisonOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onComparisonCriteriaChange(option.value)}
                  className={`px-3 py-1.5 border-r border-gray-300 last:border-r-0 transition-colors ${
                    comparisonCriteria === option.value
                      ? "bg-[#6FBD7A] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-700">Filters</span>
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
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-[#6FBD7A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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


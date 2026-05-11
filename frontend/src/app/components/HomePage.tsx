import { useEffect, useState } from "react";
import { Header } from "./Header.tsx";
import { ProductCarousel } from "./ProductCarousel.tsx";
import { searchAndCompareProducts } from "../services/products.ts";

// because serp api tokenizes searches
const CATEGORIES = [
  { query: "vegetables", label: "Vegetables" },
  { query: "fruit", label: "Fruit" },
  { query: "chicken beef pork fish", label: "Protein" },
  { query: "grains rice pasta", label: "Grains" },
  { query: "milk cheese yogurt", label: "Dairy" },
  { query: "beans lentils legumes", label: "Legumes" },
];

interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  unitPrice?: string;
}

interface HomePageProps {
  onProductClick: (product: any) => void;
  onSearch: (query: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  accountName?: string;
  accountEmail?: string;
  searchHistory?: string[];
}

function extractZip(location: string): string | undefined {
  return location.match(/\b\d{5}\b/)?.[0];
}

export function HomePage({
  onProductClick,
  onSearch,
  location,
  searchHistory = [],
  ...headerProps
}: HomePageProps) {
  const [categories, setCategories] = useState<
    { label: string; products: Product[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      setLoading(true);
      const zipCode = extractZip(location);
      const results = await Promise.all(
        CATEGORIES.map(async (category) => ({
          label: category.label,
          products: await searchAndCompareProducts(
            category.query,
            "unit price",
            10,
            zipCode
          ),
        }))
      );
      if (!cancelled) {
        setCategories(results);
        setLoading(false);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [location]);

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Header
        {...headerProps}
        location={location}
        onSearch={onSearch}
        searchHistory={searchHistory}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 px-1">
          <h2 className="text-2xl font-bold text-gray-800">
            Recommended Offers by Category
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Best unit price deals
          </p>
        </div>
        {loading ? (
          <div className="text-gray-500 px-1">Loading deals...</div>
        ) : (
          categories.map((category) => (
            <ProductCarousel
              key={category.label}
              title={category.label}
              products={category.products}
              onProductClick={onProductClick}
            />
          ))
        )}
      </main>
    </div>
  );
}
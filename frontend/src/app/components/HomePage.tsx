import { useEffect, useState } from "react";
import { Header } from "./Header.tsx";
import { ProductCarousel } from "./ProductCarousel.tsx";
import { searchAndCompareProducts } from "../services/products.ts";
import { getToken } from "../services/auth.ts";

// because serp api tokenizes searches
const CATEGORIES = [
  { query: "vegetables", label: "Vegetables" },
  { query: "fruit", label: "Fruit" },
  { query: "chicken beef pork fish", label: "Protein" },
  { query: "grains rice pasta", label: "Grains" },
  { query: "milk cheese yogurt", label: "Dairy" },
  { query: "beans lentils legumes", label: "Legumes" },
];

const PRODUCTS_PER_CAROUSEL = 10;
const CATEGORY_FETCH_COUNT = 40; // just to be safe in case we get a lot from the blacklisted stores

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

async function apiFetchBlacklist(): Promise<string[]> {
  const token = await getToken(); // get logged in state
  if (!token) return []; // if not logged in, no blacklisted stores.

  const res = await fetch("http://localhost:3000/api/block", {
    headers: { Authorization: `Bearer ${token}` },
  }); // get fetched blacklist from backend for that user

  if (!res.ok) throw new Error("Failed to load blocked stores");
  const data = await res.json();
  return data.blockedStores ?? [];
}

function normalizeStoreName(store: string): string {
  return store.trim().toLowerCase();
}

function isBlockedStore(product: Product, blockedStores: string[]): boolean {
  const productStore = normalizeStoreName(product.store ?? "");
  return blockedStores.some((store) =>
    productStore.includes(normalizeStoreName(store))
  );
}

function filterBlockedStores(products: Product[], blockedStores: string[]): Product[] {
  return products
    .filter((product) => !isBlockedStore(product, blockedStores))
    .slice(0, PRODUCTS_PER_CAROUSEL);
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
  const [loading, setLoading] = useState(true); // for when loading the page, show that we are working on getting the home page data
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      setLoading(true); // while fetching lets load
      try {
        const blockedStores = await apiFetchBlacklist(); // fetch user's blacklisted stores from backend
        const results = await Promise.all(
          CATEGORIES.map(async (category) => {
            const products = await searchAndCompareProducts( // for all categories, fetch a larger list of products to filter out blacklisted stores
              category.query,
              "unit price",
              CATEGORY_FETCH_COUNT, // fetch 40 to be safe in case we have to filter out a lot from blacklisted stores
              location
            );
            return { // once we have the results, 
              label: category.label,
              products: filterBlockedStores(products, blockedStores), // filter out any products from blacklisted stores and only keep the top 10 for the carousel
            };
          })
        );
        if (!cancelled) setCategories(results); // if not ccancelled, set the categories to the results
      } catch (err) { // if anything fails like blacklist api call or product fetch or auth issues
        console.error("Failed to load home page category deals:", err);
        const fallbackResults = await Promise.all( // if we fail, just show unfiltered results without blocking out blacklisted stores
          CATEGORIES.map(async (category) => ({
            label: category.label,
            products: await searchAndCompareProducts(
              category.query,
              "unit price",
              PRODUCTS_PER_CAROUSEL,
              location
            ),
          }))
        );
        if (!cancelled) setCategories(fallbackResults); // if error, just show unfiltered results without blocking out blacklisted stores
      } finally {
        if (!cancelled) setLoading(false); // if failed or succeeded, stop loading on the home page
      }
    }
    loadCategories(); // and load category data we got
    return () => { // if we leave home page before finishes loading, cancel
      cancelled = true;
    };
  }, [location]); // reload when location changes so we can show location specific deals on the home page

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

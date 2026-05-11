import { useState, useEffect } from "react";
import { Header } from "./components/Header.tsx";
import { ProductCarousel } from "./components/ProductCarousel.tsx";
import { LoginPage } from "./components/LoginPage.tsx";
import { ItemDetailPage } from "./components/ItemDetailPage.tsx";
import { SearchResultsPage } from "./components/SearchResultsPage.tsx";
import { SettingsPage } from "./components/SettingsPage.tsx";
import { HistoryPage } from "./components/HistoryPage.tsx"
import { searchAndCompareProducts } from "./services/products.ts";
import type { CompareSort } from "./services/products.ts";
import { onAuthChange, logOut } from "./services/auth.ts";
import { HomePage } from "./components/HomePage.tsx";

// all possible pages to access: home , search results, item comparison details,
type View = 'home' | 'search' | 'item' | 'settings' | 'login' | 'history';

// product details func: replace with real API item details and functions to find this data!
function buildItemDetails(product: any) {
  // Active promotion if the product is on sale
  const promotion =
    product.isOnSale && product.salePrice
      ? [
          {
            salePrice: product.salePrice,
            validFrom: product.saleValidFrom ?? new Date().toISOString(),
            validTo:
              product.saleValidTo ??
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            pricePerUnitItem:
              product.salePricePerUnitItem ??
              `$${product.salePrice.toFixed(2)}/${product.unit ?? "ea"}`,
          },
        ]
      : undefined;

  return {
    name: product.name,
    image: product.image,
    bestChoice: {
      store: product.store,
      price: product.price,
      unit: product.unit ?? "each",
      pricePerUnitItem:
        product.pricePerUnitItem ??
        `$${product.price.toFixed(2)}/${product.unit || "each"}`,
      isOnSale: product.isOnSale ?? false,
      promotions: promotion,
      snapEligible: product.snapEligible ?? true,
      distance: product.distance ?? "3.5 Miles away",
      address: product.address ?? "233 Russell St. Amherst MA",
      mapUrl: product.mapUrl,
      loyaltyProgramIndicator: product.loyaltyProgramIndicator,
      isOutOfStock: product.isOutOfStock ?? false,
    },
    otherRetailers: product.otherRetailers ?? [
      {
        store: "Target",
        price: product.price + 0.5,
        pricePerUnitItem: `$${(product.price + 0.5).toFixed(2)}/${product.unit || "each"}`,
        snapEligible: true,
        image: product.image,
      },
      {
        store: "Kroger",
        price: product.price + 0.75,
        pricePerUnitItem: `$${(product.price + 0.75).toFixed(2)}/${product.unit || "each"}`,
        snapEligible: false,
        image: product.image,
      },
      {
        store: "Whole Foods",
        price: product.price + 1.0,
        pricePerUnitItem: `$${(product.price + 1.0).toFixed(2)}/${product.unit || "each"}`,
        snapEligible: true,
        image: product.image,
      },
      {
        store: "Safeway",
        price: product.price + 0.3,
        pricePerUnitItem: `$${(product.price + 0.3).toFixed(2)}/${product.unit || "each"}`,
        snapEligible: true,
        image: product.image,
      },
    ],
  };
}

// ACTUAL APP UI AND DATA BEGINS HERE:
export default function App() {
  const [view, setView] = useState<View>("home");
  const [previousView, setPreviousView] = useState<View>("home");
  const [loginReturnView, setLoginReturnView] = useState<View>("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useState("Amherst, MA 01003");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [comparisonCriteria, setComparisonCriteria] = useState<CompareSort>("price");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountZip, setAccountZip] = useState("01003");

  // AUTH
  useEffect(() => { // runs on first render to subscribe once to firebase through onauthchange
    const unsubscribe = onAuthChange(async (user) => { // listening to changes to auth state! subscribed to take action
      if (user) {
        setIsAuthenticated(true);
        // Retry profile fetch up to 5 times if it failed the first time in case something didnt work the first time.
        let data: { name?: string; email?: string } | null = null; // want data to survive loops of retries
        for (let attempt = 1; attempt <= 5; attempt++) { // try 5 times then give up
          try {
            const token = await user.getIdToken(); // firebase token
            const response = await fetch("http://localhost:3000/api/user/profile", {
              headers: { Authorization: `Bearer ${token}` },}); //supabase request for the users data
            if (!response.ok) throw new Error(`HTTP ${response.status}`); 
            data = await response.json();
            break; // success, end retries 
          } catch (err) {
            console.warn(`Profile fetch attempt ${attempt}/5 failed:`, err);
            if (attempt < 5) {
              await new Promise((res) => setTimeout(res, 750));
            }
          }
        }
        // take backend supabase name, if none, then google's and if something failed just do user
        const name = data?.name ?? user.displayName ?? "User";
        const email = data?.email ?? user.email ?? "";
        setAccountName(name);
        setAccountEmail(email);
        setView(loginReturnView);
      } else {
        setIsAuthenticated(false); // logged out state, header doesnt show logged in
        setAccountName("");
        setAccountEmail("");
        if (view === "settings" || view === "history") {
          setView("home"); // safety if already not done
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = () => {
    setView(loginReturnView);
  };

  const handleLogout = async () => {
    await logOut();
    // If on a protected page, redirect to home
    if (view === "settings" || view === "history") {
      setView("home");
    }
  };

  // NAV
  const goHome = () => {
    setView("home");
    setPreviousView("home");
    setSelectedProduct(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const goToSettings = () => {
    if (!isAuthenticated) {
      setLoginReturnView(view);
      setView("login");
      return;
    }
    // Only save previousView when not already on settings —
    // clicking the profile menu while on settings would otherwise
    // overwrite previousView with 'settings' and break the back button.
    if (view !== "settings") {
      setPreviousView(view);
    }
    setView("settings");
  };

  const goToHistory = () => {
    if (!isAuthenticated) {
      setLoginReturnView(view);
      setView('login');
      return;
    }
    if (view !== 'history') {
      setPreviousView(view);
    }
    setView('history');
  };

  const handleProductClick = (product: any) => {
    setPreviousView(view);
    setSelectedProduct(product);
    setView("item");
  };

  const handleBackFromProduct = () => {
    setSelectedProduct(null);
    if (previousView === "search") {
      setView("search");
    } else {
      goHome();
    }
  };

  // SEARCH
  // CHANGING THIS RIGHT NOW TO TEST SEARCH WITH BACKEND line 217 to 238
  const handleSearch = async (query: string, criteria: CompareSort = comparisonCriteria) => {
    setSearchQuery(query);
    setComparisonCriteria(criteria);
    setView("search");

    try {
      console.log("Calling backend...");
      const backendResults = await searchAndCompareProducts(query, criteria, 20);
      console.log("Backend results:", backendResults);

      setSearchResults(backendResults);
    } catch (error) {
      // debugging code remove alert 
      alert("search failed: "  + error);
      console.error("Backend search failed:", error);
      setSearchResults([]);
    }
    // CHANGED DOWN TO HERE 

    setSearchHistory((prev: any[]) => {
      const filtered = prev.filter((q) => q !== query);
      return [query, ...filtered];
    });
  };

  const handleComparisonCriteriaChange = async (criteria: CompareSort) => {
    if (criteria === comparisonCriteria) return;

    setComparisonCriteria(criteria);
    if (searchQuery.trim()) {
      await handleSearch(searchQuery, criteria);
    }
  };

  // HEADER props — shared across pages
  const headerProps = {
    location,
    onLocationChange: setLocation,
    onLogout: handleLogout,
    onSearch: handleSearch,
    isAuthenticated,
    onLoginClick: () => {
      setLoginReturnView(view);
      setView("login");
    },
    onHomeClick: goHome,
    onSettingsClick: goToSettings,
    onHistoryClick: goToHistory,
    accountName,
    accountEmail,
    searchHistory,
  };

  // RENDERING VARIOUS PAGES:
  // rendering login page:
  if (view === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBack={() => setView(loginReturnView)}
      />
    );
  }

  // if we view settings — pass onBack using previousView
  // previousView can be 'home' | 'search' | 'item', all handled by just restoring the view
  // selectedProduct is preserved during the settings flow so item detail works correctly
  if (view === "settings") {
    return (
      <SettingsPage
        {...headerProps}
        onBack={() => {setPreviousView(view); setView(previousView);}}
        accountName={accountName}
        accountEmail={accountEmail}
        accountZip={accountZip}
        onAccountNameChange={setAccountName}
        onAccountEmailChange={setAccountEmail}
        onAccountZipChange={setAccountZip}
      />
    );
  }

  if (view === 'history') {
    return (
    <HistoryPage
      {...headerProps}
      location={location}
      onBack={() => {setPreviousView(view); setView(previousView);}}
      onLogout={handleLogout}
    />
    );
  }

  // if we view the search after searching
  if (view === "search") {
    return (
      <SearchResultsPage
        searchQuery={searchQuery}
        results={searchResults}
        comparisonCriteria={comparisonCriteria}
        onComparisonCriteriaChange={handleComparisonCriteriaChange}
        onProductClick={handleProductClick}
        onBack={goHome}
        {...headerProps}
        onLoginClick={() => {
          setLoginReturnView("search");
          setView("login");
        }}
      />
    );
  }

  // viewing product
  if (view === "item" && selectedProduct) {
    return (
      <ItemDetailPage
        item={buildItemDetails(selectedProduct)}
        onBack={handleBackFromProduct}
        {...headerProps}
        onLoginClick={() => {
          setLoginReturnView("item");
          setView("login");
        }}
      />
    );
  }

  // home page!
return <HomePage {...headerProps} onProductClick={handleProductClick} />;
}

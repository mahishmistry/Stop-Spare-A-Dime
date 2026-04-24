import { useState } from 'react';
import { Header } from './components/Header.tsx';
import { ProductCarousel } from './components/ProductCarousel.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ItemDetailPage } from './components/ItemDetailPage.tsx';
import { SearchResultsPage } from './components/SearchResultsPage.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { HistoryPage } from './components/HistoryPage.tsx'
import React from 'react';

// all possible pages to access: home , search results, item comparison details, 
type View = 'home' | 'search' | 'item' | 'settings' | 'login' | 'history';

// data -- remove later and use api endpoints for data 
const recommendations = [
  { id: '1', name: 'Organic Bananas', price: 0.49, store: 'Walmart', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400', isOnSale: true, salePrice: 0.29},
  { id: '2', name: 'Whole Milk Gallon', price: 3.99, store: 'Target', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400' },
  { id: '3', name: 'Free Range Eggs', price: 4.29, store: 'Kroger', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },
  { id: '4', name: 'Fresh Strawberries', price: 3.99, store: 'Whole Foods', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400' },
  { id: '5', name: 'Organic Spinach', price: 2.99, store: 'Trader Joes', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
  { id: '6', name: 'Avocados', price: 1.29, store: 'Costco', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400' },
];
const biggestSales = [
  { id: '7', name: 'Ground Beef 1lb', price: 4.99, store: 'Safeway', image: 'https://justcook.butcherbox.com/wp-content/uploads/2019/06/ground-beef.jpg' },
  { id: '8', name: 'Sourdough Bread', price: 3.49, store: 'Walmart', image: 'https://www.theperfectloaf.com/wp-content/uploads/2015/12/theperfectloaf-mybestsourdoughrecipe-title-1.jpg' },
  { id: '9', name: 'Baby Carrots', price: 1.99, store: 'Target', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { id: '10', name: 'Greek Yogurt', price: 0.99, store: 'Aldi', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400' },
  { id: '11', name: 'Chicken Breast', price: 6.99, store: 'Kroger', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400' },
  { id: '12', name: 'Tomatoes', price: 2.49, store: 'Whole Foods', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400' },
];
const allOtherAvailableProducts = [
  { id: '13', name: 'Coca-Cola Diet Coke Soda 2L Bottle', price: 2.50, store: 'Walmart', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400' },
  { id: '14', name: 'Coca-Cola Classic 2L Bottle', price: 2.99, store: 'Target', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400' },
  { id: '15', name: 'Pepsi Cola 2L Bottle', price: 2.49, store: 'Kroger', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400' },
  { id: '16', name: 'Sprite Lemon-Lime Soda 2L', price: 2.75, store: 'Walmart', image: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400' },
  { id: '17', name: 'Orange Juice - Tropicana', price: 4.99, store: 'Whole Foods', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400' },
  { id: '18', name: "Apple Juice - Martinez's", price: 3.49, store: 'Safeway', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400' },
];

// temporary search function replace later and edit possibly even move to header component
function runSearch(query: string) {
  const all = [
    ...recommendations,
    ...biggestSales,
    ...allOtherAvailableProducts,
  ];
  return all
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .map((p, i) => ({
      ...p,
      saleLabel: i % 3 === 0 ? "SALE" : undefined,
      saleEndDate: i % 3 === 0 ? "6/29" : undefined,
      dealText: i % 2 === 0 ? `2/$${(p.price * 2).toFixed(2)}` : undefined,
      unitPrice: `$${(p.price / 16).toFixed(2)}/oz`,
      savingsText: i % 3 === 0 ? "Save $1.19" : undefined,
      snapEligible: i % 4 !== 0, // most items SNAP eligible, some aren't
      loyaltyProgramIndicator: i % 2 === 0, // alternating loyalty programs
    }));
}

// product details func: replace with real API item details and functions to find this data!
function buildItemDetails(product: any) {
  // Active promotion if the product is on sale
  const promotion = product.isOnSale && product.salePrice
    ? [{
        salePrice: product.salePrice,
        validFrom: product.saleValidFrom ?? new Date().toISOString(),
        validTo: product.saleValidTo ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        pricePerUnitItem: product.salePricePerUnitItem ?? `$${product.salePrice.toFixed(2)}/${product.unit ?? 'ea'}`,
      }]
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
  const [view, setView] = useState<View>('home');
  const [previousView, setPreviousView] = useState<View>('home');
  const [loginReturnView, setLoginReturnView] = useState<View>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useState('Amherst, MA 01003');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  // Account state — lives here so ProfileMenu (via Header) stays in sync with SettingsPage edits.
  // Swap these useState defaults for Firebase reads when you wire up auth.ts.
  const [accountName,  setAccountName]  = useState('Zoe');
  const [accountEmail, setAccountEmail] = useState('p****@email.com');
  const [accountZip,   setAccountZip]   = useState('01003');

  // AUTH
  const handleLogin = () => {
    setIsAuthenticated(true);
    // Return to the page the user was on before being sent to login
    setView(loginReturnView);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // If on a protected page, redirect to home
    if (view === 'settings' || view === 'history') {
      setView('home');
    }
  };

  // NAV
  const goHome = () => {
    setView('home');
    setPreviousView('home');
    setSelectedProduct(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const goToSettings = () => {
    if (!isAuthenticated) {
      setLoginReturnView(view);
      setView('login');
      return;
    }
    // Only save previousView when not already on settings —
    // clicking the profile menu while on settings would otherwise
    // overwrite previousView with 'settings' and break the back button.
    if (view !== 'settings') {
      setPreviousView(view);
    }
    setView('settings');
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
    setView('item');
  };

  const handleBackFromProduct = () => {
    setSelectedProduct(null);
    if (previousView === 'search') {
      setView('search');
    } else {
      goHome();
    }
  };

  // SEARCH
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults(runSearch(query));
    setView('search');
  };

  // HEADER props — shared across pages
  const headerProps = {
    location,
    onLocationChange: setLocation,
    onLogout: handleLogout,
    onSearch: handleSearch,
    isAuthenticated,
    onLoginClick: () => { setLoginReturnView(view); setView('login'); },
    onHomeClick: goHome,
    onSettingsClick: goToSettings,
    onHistoryClick: goToHistory,
    accountName,
    accountEmail,
  };

  // RENDERING VARIOUS PAGES:
  // rendering login page:
  if (view === 'login') {
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
  if (view === 'settings') {
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
  if (view === 'search') {
    return (
      <SearchResultsPage
        searchQuery={searchQuery}
        results={searchResults}
        location={location}
        onProductClick={handleProductClick}
        onBack={goHome}
        onLogout={handleLogout}
        onSearch={handleSearch}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => { setLoginReturnView('search'); setView('login'); }}
        onHomeClick={goHome}
        onLocationChange={setLocation}
        onSettingsClick={goToSettings}
        onHistoryClick={goToHistory}
      />
    );
  }

  // viewing product
  if (view === 'item' && selectedProduct) {
    return (
      <ItemDetailPage
        item={buildItemDetails(selectedProduct)}
        onBack={handleBackFromProduct}
        onLogout={handleLogout}
        onSearch={handleSearch}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => { setLoginReturnView('item'); setView('login'); }}
        onHomeClick={goHome}
        onLocationChange={setLocation}
        location={location}
        onSettingsClick={goToSettings}
        onHistoryClick={goToHistory}
      />
    );
  }

  // home page!
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Header {...headerProps} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ProductCarousel
          title="Recommendations"
          products={recommendations}
          onProductClick={handleProductClick}
        />
        <ProductCarousel
          title="Biggest Sales"
          products={biggestSales}
          onProductClick={handleProductClick}
        />
      </main>
    </div>
  );
}
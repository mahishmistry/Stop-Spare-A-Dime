import React from "react";
import { useState } from 'react';
import { Header } from './components/Header';
import { ProductCarousel } from './components/ProductCarousel';
import { LocationModal } from './components/LocationModal';
import { LoginPage } from './components/LoginPage';
import { ItemDetailPage } from './components/ItemDetailPage';
import { SearchResultsPage } from './components/SearchResultsPage';
import { SettingsPage } from './components/SettingsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useState('New York, NY');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'settings'>('home');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedProduct(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const handleBackToHome = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filter products that match the search query
    const allProducts = [...recommendations, ...biggestSales, ...allAvailableProducts];
    const results = allProducts
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .map((p, index) => ({
        ...p,
        saleLabel: index % 3 === 0 ? 'SALE' : undefined,
        saleEndDate: index % 3 === 0 ? '6/29' : undefined,
        dealText: index % 2 === 0 ? `2/$${(p.price * 2).toFixed(2)}` : undefined,
        unitPrice: `$${(p.price / 16).toFixed(2)}/oz`,
        savingsText: index % 3 === 0 ? 'Save $1.19' : undefined,
      }));
    setSearchResults(results);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Additional products for search functionality
  const allAvailableProducts = [
    {
      id: '13',
      name: 'Coca-Cola Diet Coke Soda 2L Bottle',
      price: 2.50,
      store: 'Walmart',
      image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    },
    {
      id: '14',
      name: 'Coca-Cola Classic 2L Bottle',
      price: 2.99,
      store: 'Target',
      image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    },
    {
      id: '15',
      name: 'Pepsi Cola 2L Bottle',
      price: 2.49,
      store: 'Kroger',
      image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400',
    },
    {
      id: '16',
      name: 'Sprite Lemon-Lime Soda 2L',
      price: 2.75,
      store: 'Walmart',
      image: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400',
    },
    {
      id: '17',
      name: 'Orange Juice - Tropicana',
      price: 4.99,
      store: 'Whole Foods',
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    },
    {
      id: '18',
      name: 'Apple Juice - Martinelli\'s',
      price: 3.49,
      store: 'Safeway',
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    },
  ];

  const recommendations = [
    {
      id: '1',
      name: 'Organic Bananas',
      price: 0.49,
      store: 'Walmart',
      image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400',
    },
    {
      id: '2',
      name: 'Whole Milk Gallon',
      price: 3.99,
      store: 'Target',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    },
    {
      id: '3',
      name: 'Free Range Eggs',
      price: 4.29,
      store: 'Kroger',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
    },
    {
      id: '4',
      name: 'Fresh Strawberries',
      price: 3.99,
      store: 'Whole Foods',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
    },
    {
      id: '5',
      name: 'Organic Spinach',
      price: 2.99,
      store: 'Trader Joes',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    },
    {
      id: '6',
      name: 'Avocados',
      price: 1.29,
      store: 'Costco',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
    },
  ];

  const biggestSales = [
    {
      id: '7',
      name: 'Ground Beef 1lb',
      price: 4.99,
      store: 'Safeway',
      image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400',
    },
    {
      id: '8',
      name: 'Sourdough Bread',
      price: 3.49,
      store: 'Walmart',
      image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=400',
    },
    {
      id: '9',
      name: 'Baby Carrots',
      price: 1.99,
      store: 'Target',
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    },
    {
      id: '10',
      name: 'Greek Yogurt',
      price: 0.99,
      store: 'Aldi',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    },
    {
      id: '11',
      name: 'Chicken Breast',
      price: 6.99,
      store: 'Kroger',
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
    },
    {
      id: '12',
      name: 'Tomatoes',
      price: 2.49,
      store: 'Whole Foods',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
    },
  ];

  // If there's a search query, show search results
  if (searchQuery && !selectedProduct) {
    return (
      <>
        <SearchResultsPage
          searchQuery={searchQuery}
          results={searchResults}
          location={location}
          onProductClick={handleProductClick}
          onBack={handleBackToHome}
          onShowProfileMenu={() => {}}
        />
        <LocationModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          currentLocation={location}
          onLocationChange={setLocation}
        />
      </>
    );
  }
      if (currentPage === 'settings') {
  return (
    <SettingsPage
      location={location}
      onBack={() => setCurrentPage('home')}
      onLogout={handleLogout}
    />
  );
}
  // If a product is selected, show the detail page
  if (selectedProduct) {
    const itemDetails = {
      name: selectedProduct.name,
      image: selectedProduct.image,
      bestChoice: {
        store: selectedProduct.store,
        price: selectedProduct.price,
        salePrice: selectedProduct.id === '1' ? 2.50 : undefined,
        unitPrice: '$0.04/oz',
        snapEligible: true,
        distance: '3.5 Miles away',
        address: '233 Russell St. Amherst MA',
        savings: selectedProduct.id === '1' ? 'SAVE AT LEAST $0.47 PER TWO BOTTLES!' : undefined,
      },
      otherRetailers: [
        {
          store: 'Target',
          price: selectedProduct.price + 0.50,
          unitPrice: '$0.05/oz',
          snapEligible: true,
          image: selectedProduct.image,
        },
        {
          store: 'Kroger',
          price: selectedProduct.price + 0.75,
          unitPrice: '$0.06/oz',
          snapEligible: false,
          image: selectedProduct.image,
        },
        {
          store: 'Whole Foods',
          price: selectedProduct.price + 1.00,
          unitPrice: '$0.07/oz',
          snapEligible: true,
          image: selectedProduct.image,
        },
        {
          store: 'Safeway',
          price: selectedProduct.price + 0.30,
          unitPrice: '$0.05/oz',
          snapEligible: true,
          image: selectedProduct.image,
        },
      ],
    };


    return (
      <>
        <ItemDetailPage
          item={itemDetails}
          onBack={handleBackToHome}
          location={location}
          onLocationClick={() => setLocationModalOpen(true)}
        />
        <LocationModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          currentLocation={location}
          onLocationChange={setLocation}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <Header
        location={location}
        onLocationClick={() => setLocationModalOpen(true)}
        onLogout={handleLogout}
        onSearch={handleSearch}
        onSettingsClick={() => setCurrentPage('settings')}
        onHistoryClick={() => console.log('history later')}
      />

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

      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={location}
        onLocationChange={setLocation}
      />
    </div>
  );
}
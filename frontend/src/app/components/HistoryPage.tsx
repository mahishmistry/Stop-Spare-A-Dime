import { ChevronLeft } from 'lucide-react'; // https://lucide.dev/icons/
import React, { useState } from 'react';
import { Header } from './Header.tsx';

interface HistoryPageProps {
  location: string;
  onLocationChange: (location: string) => void;
  onBack: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick: () => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  accountName: string;
  accountEmail: string;
}

export function HistoryPage({
  location,
  onLocationChange,
  onBack,
  onLogout,
  onSearch,
  isAuthenticated,
  onLoginClick,
  onHomeClick,
  onSettingsClick,
  onHistoryClick,
  accountName,
  accountEmail,
}: HistoryPageProps) {
  const [historyItems, setHistoryItems] = useState([
    { id: 1, text: 'Organic Bananas' },
    { id: 2, text: 'Whole Milk Gallon' },
    { id: 3, text: 'Searched: "Orange Juice"' },
    { id: 4, text: 'Free Range Eggs' },
    { id: 5, text: 'Fresh Strawberries' },
    { id: 6, text: 'Searched: "Bread"' },
    { id: 7, text: 'Ground Beef 1lb' },
    { id: 8, text: 'Organic Spinach' },
    { id: 9, text: 'Avocados' },
    { id: 10, text: 'Searched: "Yogurt"' },
  ]);

  const handleClearHistory = () => {
    setHistoryItems([]);
  };

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
        accountName={accountName}
        accountEmail={accountEmail}
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-[calc(100vh-200px)] flex flex-col">

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">History</h1>
            {historyItems.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {historyItems.length > 0 ? (
            <div className="overflow-y-auto flex-1 pr-4 space-y-4">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 border-b border-gray-100 last:border-0 text-gray-700 hover:bg-gray-50 px-2 rounded transition-colors cursor-pointer"
                >
                  {item.text}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Your history is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
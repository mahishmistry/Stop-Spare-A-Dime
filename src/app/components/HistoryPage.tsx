import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

interface HistoryPageProps{
    location: string;
    onBack: ()=> void;
    onLogout: ()=> void;
}

//smth to fill up the history page
export function HistoryPage({ location, onBack }: HistoryPageProps) {
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
      {/* Header from Settings Page */}
      <header className="bg-[#F5F5F5] border-b border-[#e0e0e0] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
            <span className="font-semibold text-gray-800">Stop-Spare-A-Dime</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{location}</span>
            <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
          </div>
        </div>
      </header>

      {/* Main History Page Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-[calc(100vh-200px)] flex flex-col">
          
          {/* Header Row */}
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

          {/* Scrollable List */}
          {historyItems.length > 0 ? (
            <div className="overflow-y-auto flex-1 pr-4 space-y-4 custom-scrollbar">
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

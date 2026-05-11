import { ChevronLeft, Search, Clock, ArrowRight } from 'lucide-react'; // https://lucide.dev/icons/
import React, { useState, useEffect } from 'react';
import { Header } from './Header.tsx';

//to get history for connecting to backend - ava
import { getSearchHistory } from '../services/products';


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

/** Capitalize the first letter of each word for display */
function capitalizeQuery(query: string): string {
  return query
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  
  const[historyItems, setHistoryItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getSearchHistory();
        // If your backend returns objects instead of strings, map them here:
        // setHistoryItems(data.map((item: any) => item.query) || []);
        setHistoryItems(data || []);
      } catch (error) {
        console.error("Failed to fetch search history:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (isAuthenticated) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  //got rid of clear history func so dont have to deal with that


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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#6FBD7A]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#6FBD7A]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Search History</h1>
                {historyItems.length > 0 && !isLoading && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {historyItems.length} recent {historyItems.length === 1 ? 'search' : 'searches'}
                  </p>
                )}
              </div>
            </div>
            {/* Clear History button is hidden for now until the API is built */}
          </div>
          
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="w-8 h-8 border-3 border-gray-200 border-t-[#6FBD7A] rounded-full"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
              <p className="text-gray-400 text-sm">Loading history...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : historyItems.length > 0 ? (
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {historyItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onSearch(item)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-lg border border-gray-100 bg-white hover:border-[#6FBD7A]/40 hover:bg-[#6FBD7A]/5 transition-all duration-200 cursor-pointer group text-left"
                >
                  {/* Search icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#6FBD7A]/15 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                    <Search className="w-4.5 h-4.5 text-gray-400 group-hover:text-[#6FBD7A] transition-colors duration-200" />
                  </div>

                  {/* Query text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-800 group-hover:text-[#6FBD7A] transition-colors duration-200 truncate">
                      {capitalizeQuery(item)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Click to search again
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#6FBD7A] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-gray-500 font-medium">No search history yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your searches will appear here after you look up products.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { MapPin, Search, Menu, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { LocationModal } from './LocationModal';
import { ProfileMenu } from './ProfileMenu';

interface HeaderProps { // HEADER PARAMS
  location: string;
  onLogout: () => void;
  onSearch: (query: string) => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onHomeClick?: () => void;
  onLocationChange: (location: string) => void;
  onSettingsClick: () => void;
}

interface LocationButtonProps { // LOCATION BUTTON PARAMS
  location: string;
  showDropdown: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLocationChange: (loc: string) => void;
  fullWidth?: boolean;
}

function LocationButton({ location, showDropdown, onToggle, onClose, onLocationChange, fullWidth }: LocationButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-[#6FBD7A] transition-colors bg-white whitespace-nowrap ${fullWidth ? 'w-full text-left' : ''}`}
      >
        <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <span className="text-sm text-gray-700">{location || 'Set location'}</span>
      </button>

      <LocationModal
        isOpen={showDropdown}
        onClose={onClose}
        currentLocation={location}
        onLocationChange={onLocationChange}
        containerRef={containerRef}
      />
    </div>
  );
}

interface SearchInputProps { // SEARCH BAR PARAMS
  searchQuery: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  autoFocus?: boolean;
}

function SearchInput({ searchQuery, onQueryChange, onSearch, autoFocus }: SearchInputProps) {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search for groceries..."
        value={searchQuery}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }} // APP.tsx search function. runSearch()
        // when backend endpoints created, runSearch in app.tsx should be connected to products.ts for the API calls
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent bg-white"
        autoFocus={autoFocus}
      />
    </div>
  );
}

// HEADER BELOW
export function Header({
  location,
  onLogout, // updating on logout
  onSearch, // updating on search query
  isAuthenticated, // logged in or not
  onLoginClick, // prompting login
  onHomeClick, // going to home page
  onLocationChange, // location modal if updated location
  onSettingsClick, // clicking on user pfp if logged in
}: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false); // hide the search bar on mobile or not
  // Mobile menu is the menu icon (3 lines stacked) containing the search bar and zip code setter.
  const [showLocationDropdown, setShowLocationDropdown] = useState(false); // location changer open or closed
  const [searchQuery, setSearchQuery] = useState(''); // searching default empty

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery); // sends query up to app.tsx to runSearch function, which should do api calls
      // SEE: services/products.ts for that api backend calls.
      setShowMobileMenu(false); // hide the search/location menu on mobile, if on mobile.
    }
  };

  return (
    <header className="bg-[#F5F5F5] border-b border-[#e0e0e0] py-3 px-4 md:py-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">

          {/* Logo + site name on click should return to the home page, a button */}
          <button
            onClick={onHomeClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="Stop and Spare A Dime"
              className="w-9 h-9 md:w-12 md:h-12 object-contain"
              style={{ position: 'relative', top: '1px' }}
            />
            <span className="font-semibold text-gray-800 text-sm md:text-base hidden sm:block">
              Stop-Spare-A-Dime
            </span>
          </button>

          {/* Wide Resolutions:Laptop/Desktop: location + search */}
          {/* hidden md:flex means mobile is hidden, and shown on desktop*/}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-3xl">
            <LocationButton
              location={location}
              showDropdown={showLocationDropdown}
              onToggle={() => setShowLocationDropdown((prev) => !prev)}
              onClose={() => setShowLocationDropdown(false)}
              onLocationChange={(loc) => { onLocationChange(loc); setShowLocationDropdown(false); }}
            />
            <SearchInput
              searchQuery={searchQuery}
              onQueryChange={setSearchQuery}
              onSearch={handleSearch}
            />
          </div>


          <div className="flex items-center gap-2"> 
            {/* Mobile/Skinny Resolutions Mobile Menu Icon Rendering*/}
            {/*MOBILE MENU: search bar + location setting in the menu icon set up!*/}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)} 
              // make sure the mobile menu is hidden at the start
              // md:hidden means visible on mobile, hidden on desktop
              className="md:hidden p-2 text-gray-600 hover:text-[#6FBD7A] transition-colors"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />} 
              {/* If mobile menu open, show X, if closed , offer menu icon to open! */}
            </button> {/* Menu component icon is for mobile to press and open*/}

            {/* All resolutions show login/pfp on the right side */}
            {!isAuthenticated ? ( // not logged in?
              <button
                onClick={onLoginClick}
                className="px-3 py-1.5 md:px-5 md:py-2 bg-[#6FBD7A] text-white rounded-lg hover:bg-[#5da968] transition-colors font-medium text-sm"
              >
                Login
              </button>
            ) : (
              <ProfileMenu onLogout={onLogout} onSettingsClick={onSettingsClick} />
            )}
          </div>
        </div>

        {/* MOBILE MENU RENDERING HERE: */}
        {/* if we are showing Mobile menu then:*/}
        {showMobileMenu && (
          <div className="md:hidden mt-3 flex flex-col gap-2 pb-2">
            <LocationButton
              location={location}
              showDropdown={showLocationDropdown}
              onToggle={() => setShowLocationDropdown((prev) => !prev)}
              onClose={() => setShowLocationDropdown(false)}
              onLocationChange={(loc) => { onLocationChange(loc); setShowLocationDropdown(false); setShowMobileMenu(false); }}
              fullWidth
            />
            <SearchInput
              searchQuery={searchQuery}
              onQueryChange={setSearchQuery}
              onSearch={handleSearch}
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="w-full py-3 bg-[#6FBD7A] text-white rounded-lg hover:bg-[#5da968] transition-colors font-medium"
            >
              Search
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
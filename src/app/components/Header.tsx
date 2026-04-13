import {
  MapPin,
  Search,
  User,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  location: string;
  onLocationClick: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
}

export function Header({
  location,
  onLocationClick,
  onLogout,
  onSearch,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-[#F5F5F5] border-b border-[#e0e0e0] py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#B3B3B3]"></div>
          <span className="font-semibold text-gray-800">
            Stop-Spare-A-Dime
          </span>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-3xl">
          <button
            onClick={onLocationClick}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-[#6FBD7A] transition-colors bg-white whitespace-nowrap"
          >
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              {location}
            </span>
          </button>

          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onSearch(searchQuery);
                }
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FBD7A] focus:border-transparent bg-white"
            />
          </div>
        </div>

        <div className="relative">
          <button
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
            className="w-12 h-12 rounded-full bg-[#B3B3B3] hover:bg-[#6FBD7A] transition-colors flex items-center justify-center"
          >
            <User className="w-6 h-6 text-white" />
          </button>

          {showProfileMenu && (
            <div
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="font-semibold text-gray-800">
                  John Doe
                </p>
                <p className="text-sm text-gray-500">
                  john.doe@email.com
                </p>
              </div>

              <div className="py-2">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                  <User className="w-5 h-5" />
                  <span className="text-sm">My Account</span>
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Notifications</span>
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Bookmarks</span>
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                  <Bell className="w-5 h-5" />
                  <span className="text-sm">Favorites</span>
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Preferences</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
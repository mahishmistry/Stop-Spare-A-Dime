import { User, Settings, Bell, Bookmark, Heart, LogOut } from 'lucide-react'; // https://lucide.dev/icons/
import { useState, useRef, useEffect } from 'react';

interface ProfileMenuProps {
  onLogout: () => void;
  onSettingsClick: () => void;
}

export function ProfileMenu({ onLogout, onSettingsClick }: ProfileMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { // if clicked outside of the profile settings menu, hide it. 
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = () => setShowMenu(false);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setShowMenu((prev) => !prev)} /* toggles dropdown closed or open when clicking pfp*/
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#B3B3B3] hover:bg-[#6FBD7A] transition-colors flex items-center justify-center"
      >
        <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-800">John Doe</p>
            <p className="text-sm text-gray-500">john.doe@email.com</p>
          </div>

          <div className="py-2">
            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <User className="w-5 h-5" />
              <span className="text-sm">My Account</span>
            </button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
            </button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Bookmark className="w-5 h-5" />
              <span className="text-sm">Bookmarks</span>
            </button>
            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
              <Heart className="w-5 h-5" />
              <span className="text-sm">Favorites</span>
            </button>
            <button
              onClick={() => { onSettingsClick(); close(); }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={() => { onLogout(); close(); }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}